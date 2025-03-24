'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import withErrorBoundary from '../hocs/with-error-boundary';

import SearchControls from './search-controls';
import SearchResults from './search-results';
import useSearch from './use-search';

import styles from './search.module.css';

export function SearchPage({ recordsNumber }: { recordsNumber: number }) {
  const searchParameters = useSearchParams();
  const router = useRouter();
  const { error, handleSearch, ...rest } = useSearch();

  const initialQuery = useRef(searchParameters.get('query') || '');
  const [query, setQuery] = useState(initialQuery.current);
  const [isInputChanged, setInputChanged] = useState(false);

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
          router.replace(`/?query=${encodeURIComponent(query)}`);
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
        initialValue={initialQuery.current}
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

export default withErrorBoundary(SearchPage);
