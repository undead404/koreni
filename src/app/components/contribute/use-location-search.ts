import { useEffect, useState } from 'react';

import { autocomplete } from '@/app/services/locationiq';

import type { Location } from './types';

export type LocationResult = Location & { origin: 'local' | 'remote' };

export function useLocationSearch(knownLocations: Location[]) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query) {
      setResults(
        knownLocations.slice(0, 10).map((l) => ({ ...l, origin: 'local' })),
      );
      setIsLoading(false);
      return;
    }
    const abortController = new AbortController();

    let timeout: ReturnType<typeof setTimeout>;

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

      const loadRemoteLocations = async () => {
        const request = autocomplete(query, abortController);
        if (!request) return;
        try {
          const data = await request;
          if (abortController.signal.aborted) return;
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
        } catch {
          if (abortController.signal.aborted) return;
          setResults(localLocations);
        } finally {
          if (!abortController.signal.aborted) {
            setIsLoading(false);
          }
          clearTimeout(timeout);
        }
      };

      void loadRemoteLocations();
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
