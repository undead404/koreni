'use client';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';

import type { IndexationTable } from '@/shared/schemas/indexation-table';

import { PER_PAGE } from '../constants';
import useSearchParametersHack from '../hooks/use-search-parameters-hack';

import IndexTableRow from './index-table-row';
import SearchParametersListener from './search-parameters-listener';

import styles from './index-table.module.css';

export interface TableProperties {
  data: Record<string, unknown>[];
  locale: IndexationTable['tableLocale'];
  page: number;
  tableId: string;
}

const escapeRegExp = (string: string) =>
  string.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

export function IndexTable({ data, locale, page, tableId }: TableProperties) {
  const tableReference = useRef<HTMLTableElement>(null);
  const searchParameters = useSearchParametersHack();
  const [targetRowId, setTargetRowId] = useState<null | string>(null);
  const matchedTokens = useMemo(
    () =>
      (searchParameters.matchedTokens?.split(',') || [])
        .map((item) => escapeRegExp(item))
        .filter(Boolean),
    [searchParameters],
  );
  useEffect(() => {
    const tri = searchParameters.showRow;
    setTargetRowId(tri);
  }, [searchParameters]);
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
              <th
                key={key}
                className={[
                  key.length < 80 ? 'text-nowrap' : '',
                  key.toLowerCase().includes('.pdf') ? 'break-word' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
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
                isTarget={rowId === 'row-' + targetRowId}
                matchedTokens={matchedTokens}
              ></IndexTableRow>
            );
          })}
        </tbody>
      </table>
      <Suspense fallback={null}>
        <SearchParametersListener />
      </Suspense>
    </>
  );
}

export default IndexTable;
