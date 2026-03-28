import { useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import slugifyUkrainian from '@/app/helpers/slugify-ukrainian';

import { useTableStateStore } from './table-state';
import type { ContributeFormValues } from './types';

export function useFormAutoFill() {
  const { tableFileName } = useTableStateStore();
  const {
    control,
    formState: { touchedFields, dirtyFields },
    setValue,
  } = useFormContext<ContributeFormValues>();

  const titleValue = useWatch({ control, name: 'title' });

  useEffect(() => {
    if (!touchedFields.title && !dirtyFields.title && tableFileName) {
      setValue('title', tableFileName.split('.')[0]);
    }
  }, [setValue, tableFileName, touchedFields.title, dirtyFields.title]);

  useEffect(() => {
    if (titleValue && !touchedFields.id && !dirtyFields.id) {
      setValue('id', slugifyUkrainian(titleValue));
    }
  }, [setValue, titleValue, touchedFields.id, dirtyFields.id]);
}
