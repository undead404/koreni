'use client';
import { useCallback, useRef } from 'react';
import IndexTableValue from './index-table-value';

export interface TableProps {
  data: Record<string, unknown>[];
}

export default function IndexTable({ data }: TableProps) {
  const tableRef = useRef<HTMLTableElement>(null);
  const hasScrolledRef = useRef(false);
  const maybeScrollToResult = useCallback(
    (element: HTMLElement) => {
      if (hasScrolledRef.current) {
        return;
      }
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      hasScrolledRef.current = true;
    },
    [],
  );
  
  return (
    <table ref={tableRef}>
      <thead>
        <tr>
          {Object.keys(data[0]).map((key) => (
            <th key={key}>{key}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            {Object.values(row).map((value, j) => (
              <IndexTableValue key={j} onMatch={maybeScrollToResult} value={`${value}`} />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
