'use client';
import { useEffect, useMemo, useRef, useState } from 'react';

import { IndexationTable } from '@/shared/schemas/indexation-table';

import { PER_PAGE } from '../constants';
import getSearchParameters from '../helpers/get-search-parameters';
import withProviders from '../hocs/with-providers';

import IndexTableRow from './index-table-row';

import styles from './index-table.module.css';

export interface TableProperties {
  data: Record<string, unknown>[];
  locale: IndexationTable['tableLocale'];
  page: number;
  tableId: string;
}

export function IndexTable({ data, locale, page, tableId }: TableProperties) {
  const tableReference = useRef<HTMLTableElement>(null);
  const searchParameters = useMemo(() => getSearchParameters(), []);
  const [targetRowId, setTargetRowId] = useState<null | string>(null);
  const matchedTokens = useMemo(
    () => searchParameters.get('matched_tokens')?.split(',') || [],
    [searchParameters],
  );
  useEffect(() => {
    const tri = searchParameters.get('show_row');
    setTargetRowId(tri);
  }, []);
  return (
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
              className={
                `${key.length < 80 && 'text-nowrap'} ${key.toLowerCase().includes('.pdf') && 'break-word'}`
                // .pdf is for /DAKO-384-9-Rozvazhivska-prizvyshcha/1/
              }
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
  );
}

export default withProviders(IndexTable);
