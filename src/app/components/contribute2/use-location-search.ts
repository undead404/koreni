import { useEffect, useState } from 'react';

import { autocomplete } from '@/app/services/locationiq';

import type { Location } from './types';

export type LocationResult = Location & { origin: 'local' | 'remote' };

export function useLocationSearch(knownLocations: Location[]) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();
    let timeout: ReturnType<typeof setTimeout>;

    if (!query) {
      setResults(
        knownLocations.slice(0, 10).map((l) => ({ ...l, origin: 'local' })),
      );
      setIsLoading(false);
      return;
    }

    const localLocations = knownLocations
      .filter(
        (l) =>
          l.title.toLowerCase().includes(query.toLowerCase()) ||
          l.title.toLowerCase().includes(query.toLowerCase()),
      )
      .map((l) => ({ ...l, origin: 'local' as const }));

    setResults(localLocations);

    const debounceTimeout = setTimeout(() => {
      setIsLoading(true);
      timeout = setTimeout(() => {
        abortController.abort('timeout');
      }, 5000);

      // eslint-disable-next-line promise/catch-or-return
      autocomplete(query, abortController)
        .then((data) => {
          if (abortController.signal.aborted) return;
          // eslint-disable-next-line promise/always-return
          if (!data) {
            setIsLoading(false);
            return;
          }
          setResults([
            ...localLocations,
            ...data.map((l) => ({
              coordinates: [l.lat, l.lon] as [number, number],
              title: l.display_name,
              origin: 'remote' as const,
            })),
          ]);
        })
        .catch((error) => {
          if (abortController.signal.aborted) return;
          console.error(error);
          setResults(localLocations);
        })
        .finally(() => {
          if (!abortController.signal.aborted) {
            setIsLoading(false);
          }
          clearTimeout(timeout);
        });
    }, 500);

    return () => {
      abortController.abort('unmount');
      clearTimeout(timeout);
      clearTimeout(debounceTimeout);
    };
  }, [knownLocations, query]);

  return {
    query,
    setQuery,
    results,
    isLoading,
  };
}
