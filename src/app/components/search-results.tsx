import posthog from 'posthog-js';
import type { FC } from 'react';

import resultSchema from '../schemas/search-result';
import { initBugsnag } from '../services/bugsnag';
import type { SearchResult } from '../services/search';

import SearchResultItem from './search-result';

import styles from './search-results.module.css';

export interface ResultsProperties {
  searchValue: string;
  isLoading: boolean;
  recordsNumber: number;
  results: SearchResult[];
  resultsNumber: number;
}

const SearchResults: FC<ResultsProperties> = ({
  searchValue,
  isLoading,
  recordsNumber,
  results,
  resultsNumber,
}) => {
  // Safe parsing outside the render return prevents full-component crashes
  const validResults = results.map((result) => {
    const parsed = resultSchema.safeParse(result);
    if (parsed.success) {
      return parsed.data;
    } else {
      initBugsnag().notify(
        new Error('Invalid search result schema'),
        (event) => {
          event.addMetadata('searchResult', {
            search_value: searchValue,
            result_id: result.document.id,
            result_title: result.document.title,
            result_year: result.document.year,
            validation_errors: parsed.error.errors,
          });
        },
      );
      posthog.capture('invalid_search_result', {
        search_value: searchValue,
        result_id: result.document.id,
        result_title: result.document.title,
        result_year: result.document.year,
      });
      console.warn('Dropped invalid search result:', parsed.error);
      return null;
    }
  }); // Replace 'any' with inferred schema type if exported

  return (
    <div className={styles.container} aria-busy={isLoading} aria-live="polite">
      {/* Accessible Header/Status */}
      <header className={styles.header}>
        {isLoading && !resultsNumber ? (
          <span className={styles.loader} role="status">
            Завантаження...
          </span>
        ) : !searchValue && !resultsNumber ? (
          <span>Всього рядків у таблицях: {recordsNumber}</span>
        ) : (
          <span>
            Знайдено результатів для "{searchValue}": {resultsNumber}
          </span>
        )}
      </header>

      {/* Grid/List wrapper instead of rigid table */}
      <ul
        className={`${styles.resultsList} ${isLoading ? styles.loadingState : ''}`}
      >
        {validResults.map((typedResult, index) =>
          typedResult ? (
            <li key={typedResult.document.id} className={styles.resultCard}>
              {/* Record Header */}
              <div className={styles.cardHeader}>
                <h3>{typedResult.document.title || 'Невідомий документ'}</h3>
                <span className={styles.yearBadge}>
                  {typedResult.document.year || '?'}
                </span>
              </div>

              {/* Pass the full ambiguous raw object to the item renderer. 
              SearchResultItem must be refactored to handle Key-Value pairs dynamically 
              instead of relying on index-mapped values arrays.
            */}
              <div className={styles.cardBody}>
                <SearchResultItem
                  document={typedResult.document}
                  highlights={typedResult.highlights}
                  index={index}
                  searchValue={searchValue}
                />
              </div>
            </li>
          ) : (
            <li key={index} className={styles.resultCard}>
              Щось пішло не так
            </li>
          ),
        )}
      </ul>
    </div>
  );
};

export default SearchResults;
