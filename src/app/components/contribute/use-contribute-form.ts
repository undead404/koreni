import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import getDefaultValues from './default-values';
import { contributeFormSchema } from './schema';
import type { ContributeFormValues } from './types';

const DEFAULT_VALUES = getDefaultValues();

export default function useContributeForm() {
  const form = useForm<ContributeFormValues>({
    defaultValues: DEFAULT_VALUES,
    resolver: zodResolver(contributeFormSchema),
  });
  return form;
}
