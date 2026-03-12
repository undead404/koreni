import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import getDefaultValues from './default-values';
import { contributeForm2Schema } from './schema';
import type { ContributeForm2Values } from './types';

const DEFAULT_VALUES = getDefaultValues();

export default function useContributeForm() {
  const form = useForm<ContributeForm2Values>({
    defaultValues: DEFAULT_VALUES,
    resolver: zodResolver(contributeForm2Schema),
  });
  return form;
}
