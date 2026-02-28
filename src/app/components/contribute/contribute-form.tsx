'use client';
import { throttle } from 'lodash';
import posthog from 'posthog-js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import Turnstile from 'react-turnstile';

import { reverseGeocode } from '@/app/services/locationiq';

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
import LocationModal from './location-modal';
import TableInfoFields from './table-info-fields';
import type { ContributeFormProperties, ContributeFormValues } from './types';
import YearFields from './year-fields';

import styles from './contribute-form.module.css';

export default function ContributeForm({
  knownLocations,
}: ContributeFormProperties) {
  const [prUrl, setPrUrl] = useState('');
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [isLocationModalShown, setShowLocationModal] = useState(false);
  const hideLocationModal = useCallback(() => setShowLocationModal(false), []);
  const showLocationModal = useCallback(() => setShowLocationModal(true), []);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { isSubmitting },
  } = useForm<ContributeFormValues>({
    defaultValues: {
      ...restoreContributePageState(),
      ...restoreAuthorIdentity(),
    },
  });

  const allValues = useWatch({ control });
  const locationValue = useWatch({ control, name: 'location' });
  const periodTypeValue = useWatch({ control, name: 'periodType' });
  const titleValue = useWatch({ control, name: 'title' });
  const idValue = useWatch({ control, name: 'id' });

  useEffect(() => {
    saveContributePageState(allValues);
  }, [allValues]);

  // Handle title to slug mapping
  useEffect(() => {
    if (titleValue && !idValue) {
      setValue('id', slugifyUkrainian(titleValue));
    }
  }, [titleValue, idValue, setValue]);

  const handleLocationSelect = useCallback(
    (coordinates: [number, number]) => {
      setValue('location', coordinates.join(', '));
      setShowLocationModal(false);
    },
    [setValue],
  );

  const handleReset = useCallback(() => {
    if (confirm('Ви впевнені, що хочете очистити форму?')) {
      resetContributePageState();
      reset({});
      globalThis.location.reload();
    }
  }, [reset]);

  const submit = useCallback(
    async (data: ContributeFormValues) => {
      setStatus(null);
      try {
        const adjustedFormData = convertContributeFormData(data, {
          isRange: data.periodType === 'true',
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
    [turnstileToken, reset],
  );

  const contributionStartedReference = useRef(false);

  const handleFileChange = useCallback(() => {
    if (!contributionStartedReference.current) {
      contributionStartedReference.current = true;
      posthog.capture('contribution_started');
    }
  }, []);

  const [locationGuess, setLocationGuess] = useState('');

  useEffect(() => {
    if (!locationValue) return;

    const handler = throttle((value: string) => {
      const [latString, longString] = value
        .split(',')
        .map((s) => s.trim())
        .map(Number);
      if (Number.isNaN(latString) || Number.isNaN(longString)) {
        setLocationGuess('');
      } else {
        void reverseGeocode([latString, longString]).then((displayName) =>
          setLocationGuess(displayName || ''),
        );
      }
    }, 500);

    handler(locationValue);
    return () => handler.cancel();
  }, [locationValue]);

  const handleFormSubmit = useCallback(() => {
    void handleSubmit(submit);
  }, [handleSubmit, submit]);

  return (
    <>
      <div className={styles.container}>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>Додання на Корені власної таблиці</h1>
          <button
            disabled={isSubmitting}
            type="button"
            onClick={handleReset}
            className={styles.resetButton}
            title="Очистити форму та видалити збережені дані"
          >
            Очистити
          </button>
        </div>

        <form className={styles.form} onSubmit={handleFormSubmit}>
          <TableInfoFields
            isSubmitting={isSubmitting}
            register={register}
            onFileChange={handleFileChange}
          />

          <AuthorFields isSubmitting={isSubmitting} register={register} />

          <YearFields
            isSubmitting={isSubmitting}
            isRange={periodTypeValue === 'true'}
            register={register}
          />

          <LocationFields
            isSubmitting={isSubmitting}
            locationGuess={locationGuess}
            onShowLocationModal={showLocationModal}
            register={register}
          />

          <AdditionalInfoFields
            isSubmitting={isSubmitting}
            register={register}
          />

          <Turnstile
            sitekey={environment.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
            onVerify={setTurnstileToken}
          />

          <button
            type="submit"
            disabled={isSubmitting || !turnstileToken}
            className={styles.button}
          >
            {isSubmitting ? 'Подається...' : 'Подати'}
          </button>
        </form>

        <LocationModal
          isOpen={isLocationModalShown}
          onClose={hideLocationModal}
          onSelect={handleLocationSelect}
          knownLocations={knownLocations}
        />

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
          <div className={styles.status}>
            {' '}
            Переглянути статус поданої таблиці можна за посиланням:{' '}
            <a href={prUrl} target="_blank" rel="noreferrer">
              Pull Request
            </a>
          </div>
        )}
        {status?.type !== 'success' && (
          <div className={styles.comforting}>
            Якщо не виходить подати таблицю через форму – Ви завжди можете
            надіслати її нам на пошту:{' '}
            <a href="mailto:brute18@gmail.com">brute18@gmail.com</a>
          </div>
        )}
      </div>
    </>
  );
}
