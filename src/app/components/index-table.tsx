'use client';
import { useCallback, useEffect, useRef } from 'react';

import type { IndexationTable } from '@koreni/shared/schemas/indexation-table';

import { PER_PAGE } from '../constants';
import { initBugsnag } from '../services/bugsnag';

import IndexTableRow from './index-table-row';

import styles from './index-table.module.css';

export interface TableProperties {
  data: Record<string, unknown>[];
  locale: IndexationTable['tableLocale'];
  matchedTokens: string[];
  page: number;
  tableId: string;
  targetRowId: string | null;
}

export function IndexTable({
  data,
  locale,
  matchedTokens,
  page,
  tableId,
  targetRowId,
}: TableProperties) {
  const tableReference = useRef<HTMLTableElement>(null);
  const scrollMissedReported = useRef(false);

  // FM1: Detect when targetRowId is set but the row is not on this page
  useEffect(() => {
    if (!targetRowId) {
      scrollMissedReported.current = false;
      return;
    }

    const firstRowNumber = (page - 1) * PER_PAGE + 1;
    const lastRowNumber = firstRowNumber + data.length - 1;

    // Extract the numeric suffix from targetRowId: "tableId-1546" → 1546
    const rowNumberString = targetRowId.split('-').at(-1);
    const rowNumber = Math.trunc(Number(rowNumberString ?? ''));

    const isOnThisPage =
      !Number.isNaN(rowNumber) &&
      rowNumber >= firstRowNumber &&
      rowNumber <= lastRowNumber;

    if (!isOnThisPage) {
      initBugsnag().notify(
        new Error('Scroll target row not found on this page'),
        (event) => {
          event.addMetadata('scrollTarget', {
            targetRowId,
            tableId,
            page,
            firstRowNumber,
            lastRowNumber,
          });
        },
      );
    }
  }, [targetRowId, tableId, page, data.length]);

  // FM2: Callback for when the target row is found but no token matches any cell
  const handleScrollMissed = useCallback(() => {
    if (scrollMissedReported.current) return;
    scrollMissedReported.current = true;

    initBugsnag().notify(
      new Error('Scroll target row found but no matching token to anchor to'),
      (event) => {
        event.addMetadata('scrollTarget', {
          targetRowId,
          tableId,
          page,
          matchedTokens,
        });
      },
    );
  }, [targetRowId, tableId, page, matchedTokens]);

  return (
    <>
      <table
        ref={tableReference}
        className={styles.table}
        id="data"
        lang={locale}
      >
        <thead className={styles.thead}>
          <tr>
            {Object.keys(data[0]).map((key) => (
              <th key={key} scope="col">
                {key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={styles.tbody}>
          {data.map((row, index) => {
            const rowId = `row-${tableId}-${(page - 1) * PER_PAGE + index + 1}`;
            const isTarget = !!targetRowId && rowId === 'row-' + targetRowId;
            return (
              <IndexTableRow
                key={index}
                data={row}
                id={rowId}
                isTarget={isTarget}
                matchedTokens={matchedTokens}
                onScrollMissed={isTarget ? handleScrollMissed : undefined}
              />
            );
          })}
        </tbody>
      </table>
    </>
  );
}

export default IndexTable;
