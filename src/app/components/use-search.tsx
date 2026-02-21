'use client';

import type { NotifiableError } from '@bugsnag/js';
import posthog from 'posthog-js';
import { useCallback, useState } from 'react';

import environment from '../environment';
import { initBugsnag } from '../services/bugsnag';
import search, { type SearchResult } from '../services/search';
import getTypesenseClient from '../services/typesense';

const apiKey = environment.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY;
const host = environment.NEXT_PUBLIC_TYPESENSE_HOST;
const client = getTypesenseClient(apiKey, host);

export function useSearch() {
  const [searchValue, setSearchValue] = useState('');
  const [data, setData] = useState<SearchResult[]>([]);
  const [resultsNumber, setResultsNumber] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetched, setIsFetched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async (value: string) => {
    setSearchValue(value);
    if (!value) {
      setData([]);
      setResultsNumber(0);
      return;
    }
    setIsLoading(true);
    setIsFetched(false);
    setError(null);
    try {
      posthog.capture('search_performed', {
        query: value,
        query_length: value.length,
      });
      const [hits, hitsNumber] = await search({
        client,
        // facets,
        query: value,
        // ranges,
      });
      setData(hits);
      setResultsNumber(hitsNumber);
      setIsFetched(true);
      posthog.capture('search_results_returned', {
        query: value,
        results_count: hitsNumber,
      });
    } catch (error_) {
      setError('Під час пошуку сталася помилка. Будь ласка, спробуйте ще.');
      console.error(error_);
      initBugsnag().notify(error_ as NotifiableError);
      posthog.captureException(error_ as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    data,
    error,
    handleSearch,
    isFetched,
    isLoading,
    results: data,
    resultsNumber,
    searchValue,
  };
}

export default useSearch;
