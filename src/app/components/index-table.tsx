'use client';
import { useRef } from 'react';

import type { IndexationTable } from '@koreni/shared/schemas/indexation-table';

import { PER_PAGE } from '../constants';

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
            return (
              <IndexTableRow
                key={index}
                data={row}
                id={rowId}
                isTarget={!!targetRowId && rowId === 'row-' + targetRowId}
                matchedTokens={matchedTokens}
              ></IndexTableRow>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

export default IndexTable;
