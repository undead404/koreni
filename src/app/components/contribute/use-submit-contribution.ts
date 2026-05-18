import { usePostHog } from 'posthog-js/react';
import type { FormEvent } from 'react';
import type { UseFormReturn } from 'react-hook-form';

import environment from '@/app/environment';
import { submitErrorSchema, submitResponseSchema } from '@/app/schemas/api';

import { useContributionStateStore } from './contribution-state';
import convertContributeFormData from './convert-contribute-form-data';
import getDefaultValues from './default-values';
import { saveAuthorIdentity } from './local-storage';
import type { ContributeFormValues } from './types';

interface UseSubmitContributionProperties {
  form: UseFormReturn<ContributeFormValues>;
  executeTurnstile: () => Promise<string>;
  getAllColumns: () => string[];
  getTableAsObjects: () => Record<string, unknown>[];
}

export default function useSubmitContribution({
  form,
  executeTurnstile,
  getAllColumns,
  getTableAsObjects,
}: UseSubmitContributionProperties) {
  const { state: contributionState, setState: setContributionState } =
    useContributionStateStore();
  const posthog = usePostHog();

  // React 19 Compiler handles memoization natively.
  const submit = async (data: ContributeFormValues) => {
    setContributionState({
      error: '',
      prUrl: '',
      title: data.title,
      stage: 'verification',
    });

    try {
      const freshToken = await executeTurnstile();
      if (!freshToken) {
        throw new Error('Не вдалося отримати токен перевірки на людяність');
      }

      setContributionState({
        error: '',
        prUrl: '',
        title: data.title,
        stage: 'conversion',
      });

      const tableData = {
        columns: getAllColumns(),
        data: getTableAsObjects(),
      };

      const adjustedFormData = convertContributeFormData(data, tableData);
      adjustedFormData.turnstileToken = freshToken;

      setContributionState({
        error: '',
        prUrl: '',
        title: data.title,
        stage: 'transmission',
      });

      // Assuming Hono root routing. Adjust to '/api/submit' only if Hono explicitly defines that route.
      const response = await fetch(
        new URL('/api/submit', environment.NEXT_PUBLIC_API_SITE),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(adjustedFormData),
        },
      );

      const responseData = (await response.json()) as unknown;

      if (!response.ok) {
        const errorResponse = submitErrorSchema.safeParse(responseData);
        throw new Error(
          errorResponse.success
            ? errorResponse.data.error
            : `Невідома помилка: ${JSON.stringify(responseData)}`,
        );
      }

      const responseParsed = submitResponseSchema.parse(responseData);

      setContributionState({
        error: '',
        prUrl: responseParsed.url,
        title: data.title,
        stage: 'idle',
      });

      posthog.capture('contribution_success', { url: responseParsed.url });

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

      setContributionState({
        error: message,
        prUrl: '',
        title: data.title,
        stage: 'idle',
      });

      posthog.capture('contribution_error', { error: message });
    }
  };

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    // Prevent default natively, let RHF handle the promise lifecycle
    event.preventDefault();
    void form.handleSubmit(submit, () =>
      posthog.capture('contribution_submit_failed'),
    )(event);
  };

  return {
    handleFormSubmit,
    // Extracting isSubmitting from RHF ensures a single source of truth
    isSubmitting: form.formState.isSubmitting,
    error: contributionState.error,
    stage: contributionState.stage,
  };
}
