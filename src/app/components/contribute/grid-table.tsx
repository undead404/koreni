import clsx from 'clsx';
import { Trash2 } from 'lucide-react';
import { useId, useMemo } from 'react';

import { GridPagination } from './grid-pagination';
import { GridRow } from './grid-row';

import styles from './data-grid.module.css';

interface GridTableProperties {
  columns: string[];
  skippedColumns: Set<number>;
  skippedRowsElsewhere: Set<number>;
  skippedRowsAbove: number;
  topRows: Record<string, unknown>[];
  bottomRows: Record<string, unknown>[];
  hiddenCount: number;
  toggleColumn: (index: number) => void;
  toggleRow: (index: number) => void;
  expandTop: () => void;
  expandBottom: () => void;
}

export function GridTable({
  columns,
  skippedColumns,
  skippedRowsElsewhere,
  skippedRowsAbove,
  topRows,
  bottomRows,
  hiddenCount,
  toggleColumn,
  toggleRow,
  expandTop,
  expandBottom,
}: GridTableProperties) {
  const headerIdPrefix = useId();

  const renderRows = useMemo(() => {
    return (rows: Record<string, unknown>[], startOffset: number) => {
      return rows.map((row, localIndex) => {
        const globalRowIndex = skippedRowsAbove + startOffset + localIndex;
        const isRowFlagged = skippedRowsElsewhere.has(globalRowIndex);
        const isSkippedHeader = startOffset + localIndex < 0;

        return (
          <GridRow
            key={globalRowIndex}
            row={row}
            globalRowIndex={globalRowIndex}
            columns={columns}
            skippedColumns={skippedColumns}
            isRowFlagged={isRowFlagged}
            isSkippedHeader={isSkippedHeader}
            toggleRow={toggleRow}
          />
        );
      });
    };
  }, [
    columns,
    skippedColumns,
    skippedRowsElsewhere,
    skippedRowsAbove,
    toggleRow,
  ]);

  return (
    <div
      className={styles.tableContainer}
      role="region"
      aria-label="Перегляд загального вигляду таблиці"
    >
      <table className={styles.table}>
        <thead className={styles.thead}>
          <tr>
            <th
              className={styles.thRowCtrl}
              aria-label="Контрольні елементи рядів"
            >
              №
            </th>
            {columns.map((col, ci) => (
              <th
                key={`${headerIdPrefix}-${ci}`}
                className={clsx({
                  [styles.thFlagged]: skippedColumns.has(ci),
                })}
              >
                <div className={styles.thInner}>
                  <span className={styles.thLabel}>{col}</span>
                  <button
                    type="button"
                    className={clsx({
                      [styles.colTrashBtnActive]: skippedColumns.has(ci),
                      [styles.colTrashBtn]: !skippedColumns.has(ci),
                    })}
                    onClick={() => toggleColumn(ci)}
                    aria-label={
                      skippedColumns.has(ci)
                        ? `Скасувати вилучення колонки "${col}"`
                        : `Позначити колонку "${col}" для вилучення`
                    }
                    title={
                      skippedColumns.has(ci)
                        ? `Повернути колонку "${col}"`
                        : `Позначити колонку "${col}" для вилучення`
                    }
                  >
                    <Trash2 size={14} strokeWidth={2} />
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody className={styles.tbody}>
          {renderRows(topRows, 0)}

          <GridPagination
            hiddenCount={hiddenCount}
            columnsLength={columns.length}
            expandTop={expandTop}
            expandBottom={expandBottom}
          />

          {bottomRows.length > 0 &&
            renderRows(bottomRows, topRows.length + hiddenCount)}
        </tbody>
      </table>
    </div>
  );
}
