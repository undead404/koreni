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

  const [filters, setFilters] = useState({
    query: searchParameters.get('query') || '',
    yearFrom: searchParameters.get('year_from') || '',
    yearTo: searchParameters.get('year_to') || '',
  });

  // Extract current page from URL, defaulting to 1
  const currentPage = Number.parseInt(searchParameters.get('page') || '1', 10);
  const totalPages = Math.ceil(rest.resultsNumber / PER_PAGE);

  const activeQuery = searchParameters.get('query') || '';
  const activeYearFrom = searchParameters.get('year_from') || '';
  const activeYearTo = searchParameters.get('year_to') || '';

  // The URL is the single source of truth for fetching data.
  useEffect(() => {
    void handleSearch(activeQuery, activeYearFrom, activeYearTo, currentPage);
  }, [activeQuery, activeYearFrom, activeYearTo, currentPage, handleSearch]);

  // Debounce the URL update. This prevents spamming Next.js router history.
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const trimmedQuery = filters.query.trim();
      const trimmedYearFrom = filters.yearFrom.trim();
      const trimmedYearTo = filters.yearTo.trim();

      // Only push to router if the intended state differs from the URL
      if (
        trimmedQuery !== activeQuery ||
        trimmedYearFrom !== activeYearFrom ||
        trimmedYearTo !== activeYearTo
      ) {
        const parameters = new URLSearchParams(searchParameters.toString());

        if (trimmedQuery) {
          parameters.set('query', trimmedQuery);
        } else {
          parameters.delete('query');
        }

        if (trimmedYearFrom) {
          parameters.set('year_from', trimmedYearFrom);
        } else {
          parameters.delete('year_from');
        }

        if (trimmedYearTo) {
          parameters.set('year_to', trimmedYearTo);
        } else {
          parameters.delete('year_to');
        }

        parameters.set('page', '1'); // Reset to page 1 on new search query or filters

        if (!trimmedQuery && !trimmedYearFrom && !trimmedYearTo) {
          parameters.delete('page');
        }

        // scroll: false prevents the page from jumping to the top on every keystroke
        router.replace(`${pathname}?${parameters.toString()}`, {
          scroll: false,
        });
      }
    }, 400); // 400ms is the standard optimal threshold for text input debouncing

    return () => { clearTimeout(timeoutId); };
  }, [
    filters,
    activeQuery,
    activeYearFrom,
    activeYearTo,
    pathname,
    router,
    searchParameters,
  ]);

  const handleQueryChange = useCallback((query: string) => {
    setFilters((previous) => ({ ...previous, query }));
  }, []);

  const handleYearCommit = useCallback((yearFrom: string, yearTo: string) => {
    setFilters((previous) => ({ ...previous, yearFrom, yearTo }));
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
      <SearchControls
        filters={filters}
        onQueryChange={handleQueryChange}
        onYearCommit={handleYearCommit}
      />

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
