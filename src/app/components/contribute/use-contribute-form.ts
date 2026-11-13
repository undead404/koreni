import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef } from 'react';
import { type Resolver, useForm, type UseFormReturn } from 'react-hook-form';

import { checkIdAvailability, takenIdMessage } from './check-id-availability';
import getDefaultValues from './default-values';
import { contributeFormSchema, submissionIdSchema } from './schema';
import type { ContributeFormValues } from './types';

const DEFAULT_VALUES = getDefaultValues();

export default function useContributeForm() {
  const generation = useRef(0);
  const localResolver = zodResolver(contributeFormSchema);
  const resolver: Resolver<ContributeFormValues> = async (
    values,
    context,
    options,
  ) => {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const current = generation.current;
      const snapshot = { ...values };
      const result = await localResolver(snapshot, context, options);
      const isFullValidation = !options.names?.length;
      const hasId = isFullValidation || options.names?.includes('id');
      const hasRelevantErrors = Object.keys(result.errors).some(
        (key) =>
          isFullValidation ||
          options.names?.some(
            (name) => name === key || name.startsWith(`${key}.`),
          ),
      );
      if (
        !hasId ||
        hasRelevantErrors ||
        !submissionIdSchema.safeParse(snapshot.id).success
      )
        return result;
      const availability = await checkIdAvailability(snapshot.id);
      if (
        generation.current !== current ||
        form.getValues('id') !== snapshot.id
      ) {
        values = form.getValues();
        continue;
      }
      if (availability.status === 'taken')
        return {
          values: {},
          errors: {
            ...result.errors,
            id: { type: 'availability', message: takenIdMessage },
          },
        };
      return result;
    }
    return {
      values: {},
      errors: {
        id: {
          type: 'availability',
          message: 'Ідентифікатор змінився. Спробуйте ще раз.',
        },
      },
    };
  };
  const form: UseFormReturn<ContributeFormValues> =
    useForm<ContributeFormValues>({
      defaultValues: DEFAULT_VALUES,
      resolver,
    });
  useEffect(() => {
    const subscription = form.watch((_values, event) => {
      if (!event.name || event.name === 'id') generation.current += 1;
      if (
        (!event.name || event.name === 'id') &&
        form.getFieldState('id').error?.type === 'availability'
      )
        form.clearErrors('id');
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [form]);
  return form;
}
