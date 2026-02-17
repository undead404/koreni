'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import SearchControls from './search-controls';
import SearchResults from './search-results';
import useSearch from './use-search';

import styles from './search.module.css';

export function SearchPage({ recordsNumber }: { recordsNumber: number }) {
  const searchParameters = useSearchParams();
  const router = useRouter();
  const { error, handleSearch, ...rest } = useSearch();

  const [query, setQuery] = useState(searchParameters.get('query') || '');
  const [isInputChanged, setInputChanged] = useState(false);

  // Sync query with URL changes (e.g. back/forward button)
  useEffect(() => {
    const urlQuery = searchParameters.get('query') || '';
    if (urlQuery !== query) {
      setQuery(urlQuery);
      setInputChanged(false);
      if (!urlQuery) {
        void handleSearch('');
      }
    }
  }, [searchParameters]);

  const handleInput = useCallback(
    (event: CustomEvent<string>) => {
      setQuery(event.detail);
      setInputChanged(true);
    },
    [setQuery, setInputChanged],
  );

  useEffect(() => {
    let timeoutId = null;

    if (isInputChanged || query) {
      timeoutId = setTimeout(
        () => {
          const parameters = new URLSearchParams(searchParameters.toString());
          if (query) {
            parameters.set('query', query);
          } else {
            parameters.delete('query');
          }
          router.replace(`/?${parameters.toString()}`);
          void handleSearch(query);
        },
        isInputChanged ? 1000 : 0,
      );
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [query, isInputChanged, handleSearch]); // add router only in case it is really needed here

  return (
    // TODO rework results and error to be accessible and connect them to an input
    <section className={styles.section}>
      <SearchControls
        initialValue={searchParameters.get('query') || ''}
        // areRefinementsExpanded={areRefinementsExpanded}
        // onFacetChange={(event) => handleFacetChange(event.detail)}
        // onRangeChange={(event) => handleRangeChange(event.detail)}
        // onToggleRefinementsExpanded={toggleRefinementsExpanded}
        onInput={handleInput}
      />

      {error && (
        <p className={styles.errorMessage} aria-live="assertive">
          {error}
        </p>
      )}

      <SearchResults recordsNumber={recordsNumber} {...rest} />
    </section>
  );
}

export default SearchPage;
