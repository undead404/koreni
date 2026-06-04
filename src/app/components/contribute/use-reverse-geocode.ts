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

    setStatus('loading');
    const timeoutId = setTimeout(() => {
      try {
        const coords = coordinatesStringAsTupleSchema.parse(locationValue);
        reverseGeocode(coords)
          .then((result) => {
            setLocation(result || locationValue);
            setStatus('idle');
            return;
          })
          .catch((error: unknown) => {
            initBugsnag().notify(error as Error);
            posthog.capture('locationiq_reverse_geocode_error', {
              error: error instanceof Error ? error.message : String(error),
            });
            setLocation(locationValue);
            setStatus('error');
          });
      } catch {
        setLocation(locationValue);
        setStatus('error');
      }
    }, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [locationValue, posthog]);

  return { location, status };
}
