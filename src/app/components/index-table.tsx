"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

import IndexTableValue from "./index-table-value";
import styles from "./index-table.module.css";

export interface TableProps {
  data: Record<string, unknown>[];
  tableId: string;
}

export default function IndexTable({ data, tableId }: TableProps) {
  const tableRef = useRef<HTMLTableElement>(null);
  const searchParams = useSearchParams();
  const matchedTokens = useMemo(
    () => searchParams.get("matched_tokens")?.split(",") || [],
    [searchParams]
  );
  useEffect(() => {
    if (!tableRef.current) {
      return;
    }
    const targetRowId = searchParams.get("show_row");
    if (!targetRowId) {
      return;
    }
    const targetRow = tableRef.current.querySelector(`#row-${targetRowId}`);
    if (!targetRow) {
      console.error(`Row with id row-${targetRowId} not found`);
      return;
    }
    targetRow.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [searchParams]);

  return (
    <table ref={tableRef} className={styles.table}>
      <thead className={styles.thead}>
        <tr>
          {Object.keys(data[0]).map((key) => (
            <th key={key}>{key}</th>
          ))}
        </tr>
      </thead>
      <tbody className={styles.tbody}>
        {data.map((row, i) => (
          <tr key={i} id={`row-${tableId}-${i + 1}`}>
            {Object.values(row).map((value, j) => (
              <IndexTableValue
                key={j}
                matchedTokens={matchedTokens}
                value={`${value}`}
              />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
