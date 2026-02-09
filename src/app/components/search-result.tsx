'use client';

import posthog from 'posthog-js';
import { useCallback, useMemo } from 'react';

import guessPageFromRowId from '../helpers/guess-page-from-row-id';
export interface SearchResultItemProperties {
  document: {
    id: string;
    tableId: string;
    title: string;
    year?: number;
  };
  key: string;
  index: number;
  searchValue: string;
  value: {
    snippet: string;
    matched_tokens: string[];
  };
}

export default function SearchResultItem({
  document,
  index,
  key,
  searchValue,
  value,
}: SearchResultItemProperties) {
  const valueSnippet = useMemo(
    () => ({
      __html: value.snippet,
    }),
    [value.snippet],
  );
  const handleClick = useCallback(() => {
    posthog.capture('search_result_clicked', {
      table_id: document.tableId,
      table_title: document.title,
      row_id: document.id,
      year: document.year,
      search_query: searchValue,
      result_position: index,
    });
  }, [
    document.id,
    document.tableId,
    document.title,
    document.year,
    searchValue,
    index,
  ]);
  return (
    <tr>
      <th scope="row">{key}</th>
      <td
        className="snippet break-word"
        dangerouslySetInnerHTML={valueSnippet}
      ></td>
      <td>
        <a
          href={`/${document.tableId}/${guessPageFromRowId(
            document.id,
          )}?matched_tokens=${value.matched_tokens.join(
            ',',
          )}&show_row=${document.id}`}
          rel="nofollow"
          onClick={handleClick}
        >
          Див.
        </a>
      </td>
    </tr>
  );
}
