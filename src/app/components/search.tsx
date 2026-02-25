'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import useSearch from '../hooks/use-search';

import SearchControls from './search-controls';
import SearchPagination from './search-pagination';
import SearchResults from './search-results';

import styles from './search.module.css';
const PER_PAGE = 24;
export function SearchPage({ recordsNumber }: { recordsNumber: number }) {
  const searchParameters = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { error, handleSearch, ...rest } = useSearch();

  // 1. Local state only for instantaneous UI responsiveness
  const [inputValue, setInputValue] = useState(
    searchParameters.get('query') || '',
  );

  // Extract current page from URL, defaulting to 1
  const currentPage = Number.parseInt(searchParameters.get('page') || '1', 10);
  const totalPages = Math.ceil(rest.resultsNumber / PER_PAGE);

  // 2. The URL is the single source of truth for fetching data.
  // When the URL changes (via debounce or back/forward buttons), execute the search.
  useEffect(() => {
    const activeQuery = searchParameters.get('query') || '';
    setInputValue(activeQuery); // Sync local state in case of browser navigation
    void handleSearch(activeQuery);
  }, [searchParameters, handleSearch]);

  // 3. Debounce the URL update. This prevents spamming Next.js router history.
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const currentUrlQuery = searchParameters.get('query') || '';

      if (inputValue !== currentUrlQuery) {
        const parameters = new URLSearchParams(searchParameters.toString());
        if (inputValue.trim()) {
          parameters.set('query', inputValue.trim());
          parameters.set('page', '1'); // Reset to page 1 on new search query
        } else {
          parameters.delete('query');
          parameters.delete('page');
        }

        // scroll: false prevents the page from jumping to the top on every keystroke
        router.replace(`${pathname}?${parameters.toString()}`, {
          scroll: false,
        });
      }
    }, 400); // 400ms is the standard optimal threshold for text input debouncing

    return () => clearTimeout(timeoutId);
  }, [inputValue, pathname, router, searchParameters]);

  const handleInput = useCallback((event: CustomEvent<string>) => {
    setInputValue(event.detail);
  }, []);

  const handlePageChange = useCallback(
    (newPage: number) => {
      const newParameters = new URLSearchParams(searchParameters.toString());
      newParameters.set('page', newPage.toString());
      // scroll: true forces viewport back to the top of results when paginating
      router.push(`${pathname}?${newParameters.toString()}`, { scroll: true });
    },
    [pathname, router, searchParameters],
  );

  return (
    <section className={styles.section} aria-label="Пошук по записах">
      <SearchControls initialValue={inputValue} onInput={handleInput} />

      {error && (
        <div className={styles.errorMessage} role="alert" aria-live="assertive">
          {error}
        </div>
      )}

      <SearchResults
        recordsNumber={recordsNumber}
        searchValue={searchParameters.get('query') || ''}
        {...rest}
      />
      {/* Pagination Controls */}
      {rest.resultsNumber > PER_PAGE && !rest.isLoading && (
        <SearchPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </section>
  );
}

export default SearchPage;
