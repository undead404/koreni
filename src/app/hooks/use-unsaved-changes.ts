'use client';

import { useContext, useEffect, useId } from 'react';

import { UnsavedChangesContext } from '../providers/unsaved-changes-provider';

export interface UnsavedChangesGuard {
  confirmNavigation: () => boolean;
}

export function useUnsavedChanges(isDirty: boolean): UnsavedChangesGuard {
  const context = useContext(UnsavedChangesContext);
  const registrationId = useId();

  if (!context) {
    throw new Error(
      'useUnsavedChanges must be used within an UnsavedChangesProvider.',
    );
  }

  const { confirmNavigation, register } = context;

  useEffect(
    () => register(registrationId, isDirty),
    [isDirty, register, registrationId],
  );

  return { confirmNavigation };
}
