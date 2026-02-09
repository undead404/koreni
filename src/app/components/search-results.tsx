import type { FC } from 'react';

import resultSchema from '../schemas/search-result';
import type { SearchResult } from '../services/search';

import SearchResultItem from './search-result';

import styles from './search-results.module.css';

export interface ResultsProperties {
  searchValue: string;
  loading: boolean;
  recordsNumber: number;
  results: SearchResult[];
  resultsNumber: number;
}

const SearchResults: FC<ResultsProperties> = ({
  searchValue,
  loading,
  recordsNumber,
  results,
  resultsNumber,
}) => {
  return (
    // TODO enhance results visuals, keep manual selection possibility
    // TODO add accessible and more visible loader on loading
    <table className={styles.table} style={{ opacity: loading ? 0.5 : 1 }}>
      <caption className={styles.caption}>
        {loading && !resultsNumber ? (
          <>Завантаження...</>
        ) : !searchValue && !resultsNumber ? (
          <>Всього рядків у таблицях: {recordsNumber}</>
        ) : (
          <>
            Знайдено результатів для "{searchValue}": {resultsNumber}
          </>
        )}
      </caption>
      {results.map((result, index) => {
        const typedResult = resultSchema.parse(result);
        return (
          <tbody key={index} className={styles.tbody}>
            {typedResult.highlight.data && (
              <tr key={`${index}-${typedResult.document.tableId}`}>
                <th colSpan={2}>{typedResult.document.title}</th>
                <th>{typedResult.document.year || '?'}</th>
              </tr>
            )}
            {typedResult.highlight.data &&
              Object.entries(typedResult.highlight.data).map(
                ([key, value], index) => (
                  <SearchResultItem
                    document={typedResult.document}
                    key={`${key}-${index}`}
                    index={index}
                    searchValue={searchValue}
                    value={value}
                  />
                ),
              )}
          </tbody>
        );
      })}
    </table>
  );
};

export default SearchResults;
