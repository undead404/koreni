'use client';
import { usePostHog } from 'posthog-js/react';
import { useEffect } from 'react';

export function useDataLossGuard(isDirty: boolean) {
  const posthog = usePostHog();
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      posthog.capture('data_lost_guard');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty, posthog]);
}
