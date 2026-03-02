import clsx from 'clsx';
import { omit, without } from 'lodash';
import { useCallback, useMemo } from 'react';

import type { TableData } from '@/app/helpers/parse-csv-file';

import TableEditorCellValue from './table-editor-cell-value';
import useTableEditor, { ROW_STEP_SIZE } from './use-table-editor';

import styles from './table-editor.module.css';
/**
 * A component enabling editing of an imported CSV table:
 * - removing columns
 * - removing rows
 * - seeing warnings about missing column headers
 *
 * It shows only top 5 rows (not counting the header row) and only bottom 5 rows by default;
 * though more can be shown by clicking on the "Show more" buttons.
 */
export default function TableEditor({
  onSave,
  table,
  //   onChange,
}: {
  onSave: (data: TableData) => void;
  table: TableData;
  //   onChange: (table: TableData) => void;
}) {
  const [state, dispatch] = useTableEditor(table);
  const rowsWithInitialIndexes = useMemo(
    () =>
      table.data.map<[Record<string, unknown>, number]>((row, index) => [
        row,
        index,
      ]),
    [table.data],
  );
  const topItems = useMemo(() => {
    if (state.shownAbove + state.shownBelow >= rowsWithInitialIndexes.length)
      return rowsWithInitialIndexes;
    return rowsWithInitialIndexes.slice(0, state.shownAbove);
  }, [rowsWithInitialIndexes, state.shownAbove, state.shownBelow]);
  const bottomItems = useMemo(() => {
    if (topItems.length === rowsWithInitialIndexes.length) return [];
    return rowsWithInitialIndexes.slice(-state.shownBelow);
  }, [rowsWithInitialIndexes, state.shownBelow, topItems]);
  const hasLittleGap =
    bottomItems.length > 0 &&
    rowsWithInitialIndexes.length - topItems.length - bottomItems.length <=
      ROW_STEP_SIZE;
  const hasBigGap =
    bottomItems.length > 0 &&
    rowsWithInitialIndexes.length - topItems.length - bottomItems.length >
      ROW_STEP_SIZE;

  const handleSave = useCallback(() => {
    onSave({
      columns: without(table.columns, ...state.excludedColumns),
      data: table.data
        .filter((row, index) => !state.excludedRows.includes(index))
        .map((row) => omit(row, state.excludedColumns)),
    });
  }, [state.excludedColumns, state.excludedRows, table, onSave]);

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>
            <button
              className={styles.saveButton}
              onClick={handleSave}
              type="button"
            >
              Зберегти та закрити
            </button>
          </th>
          {table.columns.map((column) => (
            <th key={column}>
              <label>
                <input
                  type="checkbox"
                  value={`column-${column}`}
                  checked={!state.excludedColumns.includes(column)}
                  onChange={() =>
                    dispatch({
                      type: 'toggle-column',
                      column,
                    })
                  }
                ></input>
                {state.excludedColumns.includes(column)
                  ? 'Виключено'
                  : 'Включено'}
              </label>
            </th>
          ))}
        </tr>
        <tr>
          <th></th>
          {table.columns.map((column) => (
            <th
              key={column}
              className={clsx({
                [styles.excluded]: state.excludedColumns.includes(column),
              })}
            >
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {topItems.map(([row, initialIndex]) => (
          <tr
            key={initialIndex}
            className={clsx({
              [styles.excluded]: state.excludedRows.includes(initialIndex),
            })}
          >
            <th scope="row">
              <label>
                <input
                  type="checkbox"
                  value={`row-${initialIndex}`}
                  checked={!state.excludedRows.includes(initialIndex)}
                  onChange={() => {
                    dispatch({
                      row: initialIndex,
                      type: 'toggle-row',
                    });
                  }}
                ></input>
                {state.excludedRows.includes(initialIndex)
                  ? 'Виключено'
                  : 'Включено'}
              </label>
            </th>
            {table.columns.map((column) => (
              <td
                key={column}
                className={clsx({
                  [styles.excluded]: state.excludedColumns.includes(column),
                })}
              >
                <TableEditorCellValue value={row[column]} />
              </td>
            ))}
          </tr>
        ))}
        {hasLittleGap && (
          <tr>
            <td colSpan={table.columns.length + 1}>
              <button onClick={() => dispatch({ type: 'show-more-on-top' })}>
                Показати інші{' '}
                {rowsWithInitialIndexes.length -
                  topItems.length -
                  bottomItems.length}{' '}
                рядів
              </button>
            </td>
          </tr>
        )}
        {hasBigGap && (
          <>
            <tr>
              <td colSpan={table.columns.length + 1}>
                <button onClick={() => dispatch({ type: 'show-more-on-top' })}>
                  Показати ще {ROW_STEP_SIZE} рядів нижче
                </button>
              </td>
            </tr>
            <tr>
              <td colSpan={table.columns.length + 1}>
                (Для зручності{' '}
                {rowsWithInitialIndexes.length -
                  topItems.length -
                  bottomItems.length}{' '}
                рядів приховано)
              </td>
            </tr>
            <tr>
              <td colSpan={table.columns.length + 1}>
                <button
                  onClick={() => dispatch({ type: 'show-more-on-bottom' })}
                >
                  Показати ще {ROW_STEP_SIZE} рядів вище
                </button>
              </td>
            </tr>
          </>
        )}
        {bottomItems.map(([row, initialIndex]) => (
          <tr
            key={initialIndex}
            className={clsx({
              [styles.excluded]: state.excludedRows.includes(initialIndex),
            })}
          >
            <th scope="row">
              <label>
                <input
                  type="checkbox"
                  value={`row-${initialIndex}`}
                  checked={!state.excludedRows.includes(initialIndex)}
                  onChange={() => {
                    dispatch({
                      row: initialIndex,
                      type: 'toggle-row',
                    });
                  }}
                ></input>
                {state.excludedRows.includes(initialIndex)
                  ? 'Виключено'
                  : 'Включено'}
              </label>
            </th>
            {table.columns.map((column) => (
              <td
                key={column}
                className={clsx({
                  [styles.excluded]: state.excludedColumns.includes(column),
                })}
              >
                <TableEditorCellValue value={row[column]} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
