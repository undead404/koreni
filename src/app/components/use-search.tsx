'use client';

import type { NotifiableError } from '@bugsnag/js';
import { useCallback, useState } from 'react';

import environment from '../environment';
import ActiveBugsnag from '../services/bugsnag';
import search, { type SearchResult } from '../services/search';
import trackEvent from '../services/simple-analytics';
import getTypesenseClient from '../services/typesense';

const apiKey = environment.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY;
const host = environment.NEXT_PUBLIC_TYPESENSE_HOST;
const client = getTypesenseClient(apiKey, host);

export function useSearch() {
  // TODO rework it to the common data/isLoading/error structure?
  // TODO add isFetched or other similar variables for appropriate display of results and its state
  const [searchValue, setSearchValue] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [resultsNumber, setResultsNumber] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async (value: string) => {
    setSearchValue(value);
    if (!value) {
      setResults([]);
      setResultsNumber(0);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      trackEvent('search', { query: value });
      const [hits, hitsNumber] = await search({
        client,
        // facets,
        query: value,
        // ranges,
      });
      setResults(hits);
      setResultsNumber(hitsNumber);
    } catch (error_) {
      setError('Під час пошуку сталася помилка. Будь ласка, спробуйте ще.');
      console.error(error_);
      ActiveBugsnag.notify(error_ as NotifiableError);
    } finally {
      setLoading(false);
    }
  }, []);

  return { searchValue, results, resultsNumber, loading, error, handleSearch };
}

export default useSearch;
