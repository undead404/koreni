'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import {
  checkIdAvailability,
  type IdAvailabilityResult,
} from './check-id-availability';
import { submissionIdSchema } from './schema';
import type { ContributeFormValues } from './types';

type AvailabilityState =
  IdAvailabilityResult | { status: 'idle' | 'checking'; id: string };

export function useIdAvailability() {
  const { control, getFieldState, clearErrors, watch } =
    useFormContext<ContributeFormValues>();
  const id = useWatch({ control, name: 'id' });
  const [result, setResult] = useState<
    AvailabilityState & { generation: number }
  >({ status: 'idle', id, generation: -1 });
  const [retry, setRetry] = useState(0);
  const generation = useRef(0);
  const [revision, setRevision] = useState(0);
  const lastRetry = useRef(0);
  const request = useRef<AbortController | null>(null);

  useEffect(() => {
    const subscription = watch((_values, event) => {
      if (event.name && event.name !== 'id') return;
      generation.current += 1;
      setRevision((previous) => previous + 1);
      request.current?.abort();
      if (getFieldState('id').error?.type === 'availability') clearErrors('id');
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [watch, getFieldState, clearErrors]);

  useEffect(() => {
    const current = ++generation.current;
    const controller = new AbortController();
    request.current = controller;
    const isImmediate = lastRetry.current !== retry;
    lastRetry.current = retry;
    const run = async () => {
      const next = await checkIdAvailability(id, controller.signal);
      if (current === generation.current && !controller.signal.aborted)
        setResult({ ...next, generation: current });
    };
    const timer = submissionIdSchema.safeParse(id).success
      ? setTimeout(
          () => {
            void run();
          },
          isImmediate ? 0 : 400,
        )
      : undefined;
    return () => {
      clearTimeout(timer);
      controller.abort();
      generation.current += 1;
    };
  }, [id, retry, revision]);

  const state: AvailabilityState = submissionIdSchema.safeParse(id).success
    ? result.id !== id ||
      result.generation !== generation.current ||
      result.status === 'idle'
      ? { status: 'checking', id }
      : result
    : { status: 'idle', id };

  return {
    state,
    retry: () => {
      generation.current += 1;
      request.current?.abort();
      setResult({ status: 'checking', id, generation: -1 });
      setRetry((previous) => previous + 1);
    },
  };
}
