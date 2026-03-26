import posthog from 'posthog-js';
import { SubmitEvent, useCallback } from 'react';
import type {
  SubmitErrorHandler,
  SubmitHandler,
  UseFormReturn,
} from 'react-hook-form';

import environment from '@/app/environment';
import { submitErrorSchema, submitResponseSchema } from '@/app/schemas/api';

import { useContributionStateStore } from './contribution-state';
import convertContributeFormData from './convert-contribute-form-data';
import getDefaultValues from './default-values';
import { saveAuthorIdentity } from './local-storage';
import type { ContributeForm2Values } from './types';

interface UseSubmitContributionProperties {
  form: UseFormReturn<ContributeForm2Values>;
  turnstileToken: string;
  turnstile: { reset: () => void };
  getAllColumns: () => string[];
  getTableAsObjects: () => Record<string, unknown>[];
}

export default function useSubmitContribution({
  form,
  turnstileToken,
  turnstile,
  getAllColumns,
  getTableAsObjects,
}: UseSubmitContributionProperties) {
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

      setContributionState({
        error: '',
        isSubmitting: true,
        prUrl: '',
        title: data.title,
        stage: 'conversion',
      });

      try {
        const tableData = {
          columns: getAllColumns(),
          data: getTableAsObjects(),
        };

        const adjustedFormData = convertContributeFormData(data, tableData);

        setContributionState({
          error: '',
          isSubmitting: true,
          prUrl: '',
          title: data.title,
          stage: 'verification',
        });

        if (turnstileToken) {
          adjustedFormData.turnstileToken = turnstileToken;
        } else {
          throw new Error(
            'Будь ласка, пройдіть перевірку на людяність (Turnstile)',
          );
        }

        setContributionState({
          error: '',
          isSubmitting: true,
          prUrl: '',
          title: data.title,
          stage: 'transmission',
        });

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
          stage: 'idle',
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

        form.reset(getDefaultValues(authorIdentity));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Сталася невідома помилка';

        if (message.includes('Turnstile') || message.includes('перевірку')) {
          turnstile.reset();
        }

        setContributionState({
          error: message,
          isSubmitting: false,
          prUrl: '',
          title: data.title,
          stage: 'idle',
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

  return {
    handleFormSubmit,
    isSubmitting: contributionState.isSubmitting,
    error: contributionState.error,
    stage: contributionState.stage,
  };
}
