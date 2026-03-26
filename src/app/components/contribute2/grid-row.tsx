import { Trash2 } from 'lucide-react';
import { memo } from 'react';

import UnknownValue from '../unknown-value';

import styles from './data-grid.module.css';

interface GridRowProperties {
  row: Record<string, unknown>;
  globalRowIndex: number;
  columns: string[];
  skippedColumns: Set<number>;
  isRowFlagged: boolean;
  isSkippedHeader: boolean;
  toggleRow: (index: number) => void;
}

export const GridRow = memo(function GridRow({
  row,
  globalRowIndex,
  columns,
  skippedColumns,
  isRowFlagged,
  isSkippedHeader,
  toggleRow,
}: GridRowProperties) {
  const rowClass = isRowFlagged
    ? styles.rowFlagged
    : isSkippedHeader
      ? styles.rowSkipped
      : undefined;

  return (
    <tr className={rowClass}>
      <td className={styles.tdRowCtrl}>
        <button
          type="button"
          className={
            isRowFlagged ? styles.rowTrashBtnActive : styles.rowTrashBtn
          }
          onClick={() => toggleRow(globalRowIndex)}
          aria-label={
            isRowFlagged
              ? `Скасувати вилучення ряду ${globalRowIndex + 1}`
              : `Позначити ряд ${globalRowIndex + 1} для вилучення`
          }
          title={
            isRowFlagged
              ? `Повернути ряд ${globalRowIndex + 1}`
              : `Позначити ряд ${globalRowIndex + 1} для вилучення`
          }
        >
          <Trash2 size={14} strokeWidth={2} />
        </button>
      </td>
      {columns.map((column, ci) => (
        <td
          key={column}
          className={
            skippedColumns.has(ci) && !isRowFlagged
              ? styles.tdFlagged
              : undefined
          }
          title={row[column] ? `${row[column] as string}` : ''}
        >
          <UnknownValue value={row[column]} />
        </td>
      ))}
    </tr>
  );
});
