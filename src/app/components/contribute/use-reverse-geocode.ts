import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';

import { initBugsnag } from '@/app/services/bugsnag';
import { reverseGeocode } from '@/app/services/locationiq';

import { coordinatesStringAsTupleSchema } from './schema';

export function useReverseGeocode(locationValue?: string | null) {
  const [location, setLocation] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const posthog = usePostHog();

  useEffect(() => {
    if (!locationValue) {
      setLocation(null);
      setStatus('idle');
      return;
    }

    const abortController = new AbortController();
    setStatus('loading');
    const timeoutId = setTimeout(() => {
      try {
        const coords = coordinatesStringAsTupleSchema.parse(locationValue);
        const loadLocation = async () => {
          try {
            const result = await reverseGeocode(coords, abortController);
            if (abortController.signal.aborted) return;
            setLocation(result || locationValue);
            setStatus('idle');
          } catch (error: unknown) {
            if (abortController.signal.aborted) return;
            initBugsnag().notify(error as Error);
            posthog.capture('locationiq_reverse_geocode_error', {
              error: error instanceof Error ? error.message : String(error),
            });
            setLocation(locationValue);
            setStatus('error');
          }
        };
        void loadLocation();
      } catch {
        setLocation(locationValue);
        setStatus('error');
      }
    }, 500);

    return () => {
      abortController.abort();
      clearTimeout(timeoutId);
    };
  }, [locationValue, posthog]);

  return { location, status };
}
