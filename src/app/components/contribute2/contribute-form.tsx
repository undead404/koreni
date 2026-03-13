'use client';
import dynamic from 'next/dynamic';
import posthog from 'posthog-js';
import { type SubmitEvent, useCallback, useRef, useState } from 'react';
import {
  FormProvider,
  type SubmitErrorHandler,
  type SubmitHandler,
} from 'react-hook-form';
import Turnstile, { useTurnstile } from 'react-turnstile';

import environment from '@/app/environment';
import { submitErrorSchema, submitResponseSchema } from '@/app/schemas/api';

import type { ContributeFormProperties } from '../contribute/types';
import Loader from '../loader';

import { useContributionStateStore } from './contribution-state';
import convertContributeFormData from './convert-contribute-form-data';
import getDefaultValues from './default-values';
import { KnownLocationsContext } from './known-locations-context';
import { saveAuthorIdentity } from './local-storage';
import { useTableStateStore } from './table-state';
import type { ContributeForm2Values } from './types';
import useContributeForm from './use-contribute-form';

import styles from './contribute-form.module.css';
const ContributeFormStepper = dynamic(() => import('./stepper'), {
  ssr: false,
  loading: () => <Loader />,
});
export default function ContributeForm2({
  knownLocations,
}: ContributeFormProperties) {
  const form = useContributeForm();
  const { getAllColumns, getTableAsObjects } = useTableStateStore();
  const turnstile = useTurnstile() as { reset: () => void };

  const [turnstileToken, setTurnstileToken] = useState('');

  const contributionStartedReference = useRef(false);
  const { state: contributionState, setState: setContributionState } =
    useContributionStateStore();

  const submit: SubmitHandler<ContributeForm2Values> = useCallback(
    async (data, event) => {
      if (event) {
        event.preventDefault();
      }
      if (contributionState.isSubmitting) {
        return;
      }
      console.log(data);
      setContributionState({
        error: '',
        isSubmitting: true,
        prUrl: '',
        title: data.title,
      });
      try {
        const tableData = {
          columns: getAllColumns(),
          data: getTableAsObjects(),
        };
        console.log(tableData);
        const adjustedFormData = convertContributeFormData(data, tableData);

        console.log(adjustedFormData);

        if (turnstileToken) {
          adjustedFormData.turnstileToken = turnstileToken;
        }

        const response = await fetch(
          new URL('/api/submit', environment.NEXT_PUBLIC_API_SITE),
          {
            method: 'POST',
            body: JSON.stringify(adjustedFormData),
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
        setContributionState({
          error: '',
          isSubmitting: false,
          prUrl: responseParsed.url,
          title: data.title,
        });

        posthog.capture('contribution_success', {
          url: responseParsed.url,
        });

        const authorIdentity = {
          authorName: data.authorName,
          authorEmail: data.authorEmail,
          authorGithubUsername: data.authorGithubUsername,
        };
        saveAuthorIdentity(authorIdentity as Record<string, string>);

        // resetContributePageState();
        form.reset(getDefaultValues(authorIdentity));
        contributionStartedReference.current = false;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Сталася невідома помилка';
        setContributionState({
          error: message,
          isSubmitting: false,
          prUrl: '',
          title: data.title,
        });
        posthog.capture('contribution_error', {
          error: message,
        });
      }
    },
    [
      contributionState.isSubmitting,
      form,
      getAllColumns,
      getTableAsObjects,
      setContributionState,
      turnstile,
      turnstileToken,
    ],
  );
  const handleSubmitFailed: SubmitErrorHandler<ContributeForm2Values> =
    useCallback(() => {
      posthog.capture('contribution_submit_failed');
    }, []);

  const handleFormSubmit = useCallback(
    (event: SubmitEvent<HTMLFormElement>) => {
      void form.handleSubmit(submit, handleSubmitFailed)(event);
    },
    [form, handleSubmitFailed, submit],
  );
  return (
    <form className={styles.container} onSubmit={handleFormSubmit}>
      <div className={styles.header}>
        <h1 className={styles.title}>Нова таблиця</h1>
        <p className={styles.description}>
          Пройдіть стежкою вниз, аби завантажити, оформити та опублікувати свої
          дані.
        </p>
      </div>
      <Turnstile
        onVerify={setTurnstileToken}
        refreshExpired="auto"
        sitekey={environment.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
      />

      <FormProvider {...form}>
        <KnownLocationsContext.Provider value={knownLocations}>
          <ContributeFormStepper />
        </KnownLocationsContext.Provider>
      </FormProvider>
    </form>
  );
}
