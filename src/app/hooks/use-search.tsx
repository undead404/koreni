'use client';

import type { NotifiableError } from '@bugsnag/js';
import { usePostHog } from 'posthog-js/react';
import { useCallback, useRef, useState } from 'react';

import environment from '../environment';
import { initBugsnag } from '../services/bugsnag';
import search, { type SearchResult } from '../services/search';
import getTypesenseClient from '../services/typesense';

const apiKey = environment.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY;
const host = environment.NEXT_PUBLIC_TYPESENSE_HOST;
const client = getTypesenseClient(apiKey, host);

export function useSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [resultsNumber, setResultsNumber] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tracks the active fetch sequence to prevent race conditions
  const currentRequestId = useRef(0);
  const posthog = usePostHog();

  const handleSearch = useCallback(
    async (
      value: string,
      yearFrom: string,
      yearTo: string,
      page: number = 1,
    ) => {
      // Increment ID for every new search call
      const requestId = ++currentRequestId.current;
      const normalizedQuery = value.trim();

      if (!normalizedQuery) {
        setResults([]);
        setResultsNumber(0);
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        posthog.capture('search_performed', {
          query: normalizedQuery,
          query_length: normalizedQuery.length,
          year_from: yearFrom,
          year_to: yearTo,
        });

        const [hits, hitsNumber] = await search({
          client,
          page, // Pass page to API
          perPage: 24, // Matches typical 2-col or 3-col grid layouts
          query: normalizedQuery,
          yearFrom,
          yearTo,
        });

        // Drop stale execution context: if a newer request fired, halt state updates
        if (requestId !== currentRequestId.current) return;

        setResults(hits);
        setResultsNumber(hitsNumber);

        posthog.capture('search_results_returned', {
          query: normalizedQuery,
          results_count: hitsNumber,
          year_from: yearFrom,
          year_to: yearTo,
        });
      } catch (error_) {
        if (requestId !== currentRequestId.current) return;

        setError('Під час пошуку сталася помилка. Будь ласка, спробуйте ще.');
        console.error(error_);
        initBugsnag().notify(error_ as NotifiableError);
        posthog.captureException(error_ as Error);
      } finally {
        if (requestId === currentRequestId.current) {
          setIsLoading(false);
        }
      }
    },
    [posthog],
  );

  return {
    error,
    handleSearch,
    isLoading,
    results,
    resultsNumber,
  };
}

export default useSearch;
