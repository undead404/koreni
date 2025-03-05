'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef } from 'react';

import { PER_PAGE } from '../constants';
import withErrorBoundary from '../hocs/with-error-boundary';

import IndexTableValue from './index-table-value';

import styles from './index-table.module.css';

export interface TableProperties {
  data: Record<string, unknown>[];
  page: number;
  tableId: string;
}

export function IndexTable({ data, page, tableId }: TableProperties) {
  const tableReference = useRef<HTMLTableElement>(null);
  const searchParameters = useSearchParams();
  const matchedTokens = useMemo(
    () => searchParameters.get('matched_tokens')?.split(',') || [],
    [searchParameters],
  );
  useEffect(() => {
    if (!tableReference.current) {
      return;
    }
    const targetRowId = searchParameters.get('show_row');
    if (!targetRowId) {
      return;
    }
    const targetRow = tableReference.current.querySelector(
      `#row-${targetRowId}`,
    );
    if (!targetRow) {
      console.error(`Row with id row-${targetRowId} not found`);
      return;
    }
    const markInRow = targetRow.querySelector('mark');
    (markInRow || targetRow).scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, [searchParameters]);

  return (
    <table ref={tableReference} className={styles.table}>
      <thead className={styles.thead}>
        <tr>
          {Object.keys(data[0]).map((key) => (
            <th key={key}>{key}</th>
          ))}
        </tr>
      </thead>
      <tbody className={styles.tbody}>
        {data.map((row, index) => (
          <tr
            key={index}
            id={`row-${tableId}-${(page - 1) * PER_PAGE + index + 1}`}
          >
            {Object.values(row).map((value, index) => (
              <IndexTableValue
                key={index}
                matchedTokens={matchedTokens}
                value={`${/* eslint-disable @typescript-eslint/no-explicit-any */ value as any}`}
              />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default withErrorBoundary(IndexTable);
