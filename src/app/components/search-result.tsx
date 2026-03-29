'use client';

import Link from 'next/link';
import { usePostHog } from 'posthog-js/react';
import { useCallback, useMemo } from 'react';

import guessPageFromRowId from '../helpers/guess-page-from-row-id';

import DynamicValue from './dynamic-value';

import styles from './search-result.module.css';

export interface SearchResultItemProperties {
  document: {
    id: string;
    tableId: string;
    title: string;
    year?: number;
    raw: Record<string, unknown>;
  };
  highlights?: {
    matched_tokens: string[][];
  }[];
  index: number; // Required for PostHog positioning
  searchValue: string;
}

// --- Main Component ---
export default function SearchResultItem({
  document,
  highlights,
  index,
  searchValue,
}: SearchResultItemProperties) {
  // Extract all matched tokens for safe regex highlighting
  const tokensToHighlight = useMemo(() => {
    if (!highlights) return [];
    return highlights.flatMap((h) => h.matched_tokens.flat());
  }, [highlights]);

  // Filter empty root-level values to optimize space
  const validDataEntries = useMemo(() => {
    return Object.entries(document.raw || {}).filter(([, value]) => {
      return value !== null && value !== undefined && value !== '';
    });
  }, [document.raw]);

  const posthog = usePostHog();
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
    posthog,
    document.tableId,
    document.title,
    document.id,
    document.year,
    searchValue,
    index,
  ]);

  const recordUrl = `/${document.tableId}/${guessPageFromRowId(
    document.id,
  )}?matched_tokens=${tokensToHighlight.join(',')}&show_row=${document.id}`;

  return (
    <div className={styles.itemContainer}>
      <dl className={styles.dataGrid}>
        {validDataEntries.map(([key, value]) => (
          <div key={key} className={styles.dataGroup}>
            <dt className={styles.dataLabel}>{key}</dt>
            <dd className={styles.dataValue}>
              <DynamicValue value={value} tokens={tokensToHighlight} />
            </dd>
          </div>
        ))}
      </dl>

      <div className={styles.actionRow}>
        <Link
          className={styles.actionLink}
          href={recordUrl}
          onClick={handleClick}
          rel="nofollow"
          scroll={false}
        >
          Переглянути документ
        </Link>
      </div>
    </div>
  );
}
