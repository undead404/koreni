'use client';
import posthog from 'posthog-js';
import { SubmitEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
  FormProvider,
  SubmitHandler,
  useForm,
  useWatch,
} from 'react-hook-form';
import { Turnstile, useTurnstile } from 'react-turnstile';

import environment from '../../environment';
import slugifyUkrainian from '../../helpers/slugify-ukrainian';
import { submitErrorSchema, submitResponseSchema } from '../../schemas/api';

import AdditionalInfoFields from './additional-info-fields';
import AuthorFields from './author-fields';
import convertContributeFormData from './convert-contribute-form-data';
import {
  resetContributePageState,
  restoreAuthorIdentity,
  restoreContributePageState,
  saveAuthorIdentity,
  saveContributePageState,
} from './local-storage';
import LocationFields from './location-fields';
import TableInfoFields from './table-info-fields';
import type { ContributeFormProperties, ContributeFormValues } from './types';
import YearFields from './year-fields';

import styles from './contribute-form.module.css';

const DEFAULT_VALUES = {
  periodType: '',
  ...restoreContributePageState(),
  ...restoreAuthorIdentity(),
};

export default function ContributeForm({
  knownLocations,
}: ContributeFormProperties) {
  const turnstile = useTurnstile() as { reset: () => void };
  const [prUrl, setPrUrl] = useState('');
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [turnstileToken, setTurnstileToken] = useState('');

  const form = useForm<ContributeFormValues>({
    defaultValues: DEFAULT_VALUES,
  });
  const {
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { isSubmitting, touchedFields },
  } = form;

  const allValues = useWatch({ control });

  const titleValue = useWatch({ control, name: 'title' });

  useEffect(() => {
    saveContributePageState(allValues);
  }, [allValues]);

  // Handle title to slug mapping
  useEffect(() => {
    if (titleValue && !touchedFields.id) {
      setValue('id', slugifyUkrainian(titleValue));
    }
  }, [setValue, titleValue, touchedFields.id]);

  const handleReset = useCallback(() => {
    if (confirm('Ви впевнені, що хочете очистити форму?')) {
      posthog.capture('contribution_form_reset');
      resetContributePageState();
      reset({});
      globalThis.location.reload();
    }
  }, [reset]);

  const submit: SubmitHandler<ContributeFormValues> = useCallback(
    async (data, event) => {
      if (event) {
        event.preventDefault();
      }
      setStatus(null);
      try {
        const adjustedFormData = convertContributeFormData(data, {
          isRange: data.periodType === 'multiple',
        });

        if (turnstileToken) {
          adjustedFormData.append('turnstileToken', turnstileToken);
        }

        const response = await fetch(
          new URL('/api/submit', environment.NEXT_PUBLIC_API_SITE),
          {
            method: 'POST',
            body: adjustedFormData,
          },
        );

        if (!response.ok) {
          turnstile.reset();
          const errorData = (await response.json()) as unknown;
          const errorResponse = submitErrorSchema.safeParse(errorData);
          if (errorResponse.success) {
            throw new Error(errorResponse.data.error);
          }
          throw new Error(`Невідома помилка: ${JSON.stringify(errorData)}`);
        }

        const responseData = (await response.json()) as unknown;
        const responseParsed = submitResponseSchema.parse(responseData);
        setPrUrl(responseParsed.url);

        posthog.capture('contribution_success', {
          url: responseParsed.url,
        });

        const authorIdentity = {
          authorName: data.authorName,
          authorEmail: data.authorEmail,
          authorGithubUsername: data.authorGithubUsername,
        };
        saveAuthorIdentity(authorIdentity);

        setStatus({
          type: 'success',
          message: 'Таблиця успішно подана на розгляд!',
        });
        resetContributePageState();
        reset(authorIdentity);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Сталася невідома помилка';
        setStatus({
          type: 'error',
          message,
        });
        posthog.capture('contribution_error', {
          error: message,
        });
      }
    },
    [turnstile, turnstileToken, reset],
  );

  const contributionStartedReference = useRef(false);

  const handleFileChange = useCallback(() => {
    if (!contributionStartedReference.current) {
      contributionStartedReference.current = true;
      posthog.capture('contribution_started');
    }
  }, []);

  const handleFormSubmit = useCallback(
    (event: SubmitEvent<HTMLFormElement>) => {
      void handleSubmit(submit, console.error)(event);
    },
    [handleSubmit, submit],
  );

  return (
    <FormProvider {...form}>
      <div className={styles.container}>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>Додання на Корені власної таблиці</h1>
          <button
            type="button"
            onClick={handleReset}
            className={styles.resetButton}
            title="Очистити форму та видалити збережені дані"
          >
            Очистити
          </button>
        </div>

        <form className={styles.form} onSubmit={handleFormSubmit}>
          <TableInfoFields onFileChange={handleFileChange} />

          <AuthorFields />

          <YearFields />

          <LocationFields knownLocations={knownLocations} />

          <AdditionalInfoFields />

          <Turnstile
            onVerify={setTurnstileToken}
            refreshExpired="auto"
            sitekey={environment.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
          />

          <button
            type="submit"
            disabled={isSubmitting || !turnstileToken}
            className={styles.button}
          >
            {isSubmitting ? 'Подається...' : 'Подати'}
          </button>
        </form>

        <div className={styles.statusMessages}>
          {status && (
            <div
              className={`${styles.status} ${
                status.type === 'success' ? styles.success : styles.error
              }`}
            >
              {status.message}
            </div>
          )}
          {prUrl && (
            <div className={`${styles.status} ${styles.info}`}>
              Переглянути статус поданої таблиці можна за посиланням:{' '}
              <a href={prUrl} target="_blank" rel="noreferrer">
                Pull Request
              </a>
            </div>
          )}
          {status?.type !== 'success' && (
            <div className={`${styles.status} ${styles.warning}`}>
              Якщо не виходить подати таблицю через форму – Ви завжди можете
              надіслати її нам на пошту:{' '}
              <a href="mailto:admin@koreni.org.ua">admin@koreni.org.ua</a>
            </div>
          )}
        </div>
      </div>
    </FormProvider>
  );
}
