import type { FC } from 'react';

import guessPageFromRowId from '../helpers/guess-page-from-row-id';
import resultSchema from '../schemas/search-result';
import type { SearchResult } from '../services/search';

import styles from './search-results.module.css';

export interface ResultsProperties {
  loading: boolean;
  results: SearchResult[];
  resultsNumber: number;
}

const SearchResults: FC<ResultsProperties> = ({
  loading,
  results,
  resultsNumber,
}) => {
  return (
    // TODO enhance results visuals, keep manual selection possibility
    <table className={styles.table} style={{ opacity: loading ? 0.5 : 1 }}>
      <caption className={styles.caption}>
        Знайдено результатів: {resultsNumber}
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
                  <tr key={`${key}-${index}`}>
                    <th scope="row">{key}</th>
                    <td
                      className="snippet"
                      dangerouslySetInnerHTML={{
                        __html: value.snippet,
                      }}
                    ></td>
                    <td>
                      <a
                        className={styles.link}
                        href={`/${
                          typedResult.document.tableId
                        }/${guessPageFromRowId(
                          typedResult.document.id,
                        )}?matched_tokens=${value.matched_tokens.join(
                          ',',
                        )}&show_row=${typedResult.document.id}`}
                      >
                        Див.
                      </a>
                    </td>
                  </tr>
                ),
              )}
          </tbody>
        );
      })}
    </table>
  );
};

export default SearchResults;
