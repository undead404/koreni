'use client';

import { ErrorMessage } from '@hookform/error-message';
import clsx from 'clsx';
import { Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import UnknownValue from '../unknown-value';

import { DEFAULT_PREVIEW_SIZE, EXPAND_STEP } from './constants';
import { useTableStateStore } from './table-state';
import { ContributeForm2Values } from './types';

import styles from './data-grid.module.css';

/* ────────────────────────────────────────── */
/*  Component                                  */
/* ────────────────────────────────────────── */

let incrementalId = 0;

function getIncrementalId() {
  return incrementalId++;
}

export default function DataGrid() {
  const [numberOfRowsShownAbove, setNumberOfRowsShownAbove] =
    useState(DEFAULT_PREVIEW_SIZE);
  const [numberOfRowsShownBelow, setNumberOfRowsShownBelow] =
    useState(DEFAULT_PREVIEW_SIZE);
  const {
    getAllColumns,
    getTableAsObjects,
    getTableDimensions,
    setSkippedRowsAbove,
    skippedColumns,
    skippedRowsAbove,
    skippedRowsElsewhere,
    toggleColumn,
    toggleRow,
  } = useTableStateStore();

  /* ── Visible rows (after header skip) ── */
  const dataRows = getTableAsObjects(true);

  /* ── Rows to display (truncated or full) ── */
  const { topRows, bottomRows, hiddenCount } = useMemo(() => {
    if (
      dataRows.length <=
      numberOfRowsShownAbove + numberOfRowsShownBelow + 1
    ) {
      return {
        topRows: dataRows,
        bottomRows: [] as Record<string, unknown>[],
        hiddenCount: 0,
      };
    }
    return {
      topRows: dataRows.slice(0, numberOfRowsShownAbove),
      bottomRows: dataRows.slice(dataRows.length - numberOfRowsShownBelow),
      hiddenCount:
        dataRows.length - numberOfRowsShownAbove - numberOfRowsShownBelow,
    };
  }, [dataRows, numberOfRowsShownAbove, numberOfRowsShownBelow]);

  /* ── Flagged counts ── */
  const flaggedColCount = skippedRowsElsewhere.size;
  const flaggedRowCount = skippedColumns.size;
  const totalFlagged = flaggedColCount + flaggedRowCount;
  const columns = getAllColumns(true);
  const {
    formState: { errors },
    register,
  } = useFormContext<ContributeForm2Values>();

  return (
    <div className={styles.wrapper}>
      {/* ── Control bar ── */}
      <div className={styles.controlBar}>
        <div className={styles.controlGroup}>
          <label htmlFor="skip-rows" className={styles.controlLabel}>
            Заголовки зсунуті на:
          </label>
          <input
            id="skip-rows"
            type="number"
            min={0}
            max={dataRows.length - 1}
            value={skippedRowsAbove}
            onChange={(event) => {
              const v = Math.max(
                0,
                Math.min(dataRows.length - 1, Number(event.target.value) || 0),
              );
              setSkippedRowsAbove(v);
            }}
            className={styles.controlInput}
            step={1}
          />
        </div>
        <div className={styles.controlGroup}>
          <span className={styles.statBadge}>
            {dataRows.length} рядів &times; {getTableDimensions().columns}{' '}
            колонок
          </span>
          {totalFlagged > 0 && (
            <span className={styles.flaggedBadge}>
              {totalFlagged} до вилучення
            </span>
          )}
        </div>
      </div>

      {/* ── Scrollable table ── */}
      <div
        className={styles.tableContainer}
        role="region"
        aria-label="Перегляд загального вигляду таблиці"
      >
        <table className={styles.table}>
          {/* ── Header ── */}
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
                  key={col || `col-${getIncrementalId()}`}
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
                          ? `Повернути колонку ${col}`
                          : `Позначити колонку ${col} для вилучення`
                      }
                    >
                      <Trash2 size={11} strokeWidth={2} />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* ── Body ── */}
          <tbody className={styles.tbody}>
            {renderRows(topRows, 0)}

            {/* ── Ellipsis row ── */}
            {hiddenCount > 0 && (
              <>
                <tr className={styles.ellipsisRow}>
                  <td colSpan={columns.length + 1}>
                    <button
                      type="button"
                      className={styles.ellipsisBtn}
                      onClick={() =>
                        setNumberOfRowsShownAbove(
                          (previous) => previous + EXPAND_STEP,
                        )
                      }
                      title={`Показати ще ${EXPAND_STEP} рядів`}
                    >
                      Показати ще {EXPAND_STEP} рядів
                    </button>
                  </td>
                </tr>
                <tr className={styles.ellipsisRow}>
                  <td
                    colSpan={columns.length + 1}
                    title={`Іще ${hiddenCount.toLocaleString()} рядів приховано`}
                  >
                    Іще {hiddenCount.toLocaleString()} рядів приховано
                  </td>
                </tr>
                <tr className={styles.ellipsisRow}>
                  <td colSpan={columns.length + 1}>
                    <button
                      type="button"
                      className={styles.ellipsisBtn}
                      onClick={() =>
                        setNumberOfRowsShownBelow(
                          (previous) => previous + EXPAND_STEP,
                        )
                      }
                      title={`Показати ще ${EXPAND_STEP} рядів`}
                    >
                      Показати ще {EXPAND_STEP} рядів
                    </button>
                  </td>
                </tr>
              </>
            )}

            {bottomRows.length > 0 && renderRows(bottomRows, skippedRowsAbove)}
          </tbody>
        </table>
      </div>
      {/* Locale dropdown, using react-hook-form */}
      <label className={styles.label} htmlFor="table-locale">
        Мова таблиці
      </label>
      <select
        id="table-locale"
        className={styles.select}
        {...register('tableLocale')}
      >
        <option disabled>Виберіть мову таблиці</option>
        <option value="pl">Польська</option>
        <option value="ru">російська</option>
        <option value="uk">Українська</option>
      </select>
      <ErrorMessage
        className={styles.error}
        errors={errors}
        name="tableLocale"
        as="p"
      />
    </div>
  );

  /* ── Row renderer ── */
  function renderRows(rows: Record<string, unknown>[], startOffset: number) {
    return rows.map((row, localIndex) => {
      const globalRowIndex = skippedRowsAbove + startOffset + localIndex;
      const isRowFlagged = skippedRowsElsewhere.has(globalRowIndex);
      const isSkippedHeader = startOffset + localIndex < 0; // unused for now but future-proof
      const rowClass = isRowFlagged
        ? styles.rowFlagged
        : isSkippedHeader
          ? styles.rowSkipped
          : undefined;

      return (
        <tr key={globalRowIndex} className={rowClass}>
          <td className={styles.tdRowCtrl}>
            <button
              type="button"
              className={
                isRowFlagged ? styles.rowTrashBtnActive : styles.rowTrashBtn
              }
              onClick={() => toggleRow(globalRowIndex)}
              aria-label={
                isRowFlagged
                  ? `Повернути ряд ${globalRowIndex + 1}`
                  : `Позначити ряд ${globalRowIndex + 1} для вилучення`
              }
            >
              <Trash2 size={10} strokeWidth={2} />
            </button>
          </td>
          {columns.map((column, ci) => (
            <td
              key={ci}
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
  }
}
