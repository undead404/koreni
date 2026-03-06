'use client';

import { Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import styles from './data-grid.module.css';

/* ────────────────────────────────────────── */
/*  Sample data generator                      */
/* ────────────────────────────────────────── */

const COLUMNS = [
  'id',
  'timestamp',
  'user_email',
  'country',
  'revenue',
  'sessions',
  'bounce_rate',
  'device',
];

function generateSampleData(rowCount: number): string[][] {
  const countries = [
    'US',
    'UK',
    'DE',
    'FR',
    'JP',
    'BR',
    'IN',
    'CA',
    'AU',
    'KR',
  ];
  const devices = ['desktop', 'mobile', 'tablet'];
  const emails = [
    'alice@acme.co',
    'bob@corp.io',
    'carol@data.net',
    'dave@lab.org',
    'eve@cloud.dev',
    'frank@sys.ai',
  ];

  const rows: string[][] = [];
  for (let index = 0; index < rowCount; index++) {
    const date = new Date(2026, 0, 1 + Math.floor(index / 10));
    rows.push([
      String(index + 1),
      date.toISOString().slice(0, 10),
      emails[index % emails.length],
      countries[index % countries.length],
      (Math.random() * 5000 + 100).toFixed(2),
      String(Math.floor(Math.random() * 2000 + 50)),
      (Math.random() * 80 + 5).toFixed(1) + '%',
      devices[index % devices.length],
    ]);
  }
  return rows;
}

const TOTAL_ROWS = 842;
const ALL_DATA = generateSampleData(TOTAL_ROWS);
const PREVIEW_COUNT = 5;

/* ────────────────────────────────────────── */
/*  Component                                  */
/* ────────────────────────────────────────── */

export default function DataGrid() {
  const [skipRows, setSkipRows] = useState(0);
  const [flaggedCols, setFlaggedCols] = useState<Set<number>>(new Set());
  const [flaggedRows, setFlaggedRows] = useState<Set<number>>(new Set());
  const [expanded, setExpanded] = useState(false);

  /* ── Toggle helpers ── */
  const toggleCol = useCallback((colIndex: number) => {
    setFlaggedCols((previous) => {
      const next = new Set(previous);
      if (next.has(colIndex)) next.delete(colIndex);
      else next.add(colIndex);
      return next;
    });
  }, []);

  const toggleRow = useCallback((rowIndex: number) => {
    setFlaggedRows((previous) => {
      const next = new Set(previous);
      if (next.has(rowIndex)) next.delete(rowIndex);
      else next.add(rowIndex);
      return next;
    });
  }, []);

  /* ── Visible rows (after header skip) ── */
  const dataRows = useMemo(() => ALL_DATA.slice(skipRows), [skipRows]);

  /* ── Rows to display (truncated or full) ── */
  const { topRows, bottomRows, hiddenCount } = useMemo(() => {
    if (expanded || dataRows.length <= PREVIEW_COUNT * 2 + 1) {
      return {
        topRows: dataRows,
        bottomRows: [] as string[][],
        hiddenCount: 0,
      };
    }
    return {
      topRows: dataRows.slice(0, PREVIEW_COUNT),
      bottomRows: dataRows.slice(dataRows.length - PREVIEW_COUNT),
      hiddenCount: dataRows.length - PREVIEW_COUNT * 2,
    };
  }, [dataRows, expanded]);

  /* ── Flagged counts ── */
  const flaggedColCount = flaggedCols.size;
  const flaggedRowCount = flaggedRows.size;
  const totalFlagged = flaggedColCount + flaggedRowCount;

  return (
    <div className={styles.wrapper}>
      {/* ── Control bar ── */}
      <div className={styles.controlBar}>
        <div className={styles.controlGroup}>
          <label htmlFor="skip-rows" className={styles.controlLabel}>
            Пропустити ряди (зсув ряду заголовків)
          </label>
          <input
            id="skip-rows"
            type="number"
            min={0}
            max={TOTAL_ROWS - 1}
            value={skipRows}
            onChange={(event) => {
              const v = Math.max(
                0,
                Math.min(TOTAL_ROWS - 1, Number(event.target.value) || 0),
              );
              setSkipRows(v);
            }}
            className={styles.controlInput}
          />
        </div>
        <div className={styles.controlGroup}>
          <span className={styles.statBadge}>
            {dataRows.length} рядів &times; {COLUMNS.length} колонок
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
        aria-label="Data preview"
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
              {COLUMNS.map((col, ci) => (
                <th
                  key={col}
                  className={flaggedCols.has(ci) ? styles.thFlagged : undefined}
                >
                  <div className={styles.thInner}>
                    <span className={styles.thLabel}>{col}</span>
                    <button
                      type="button"
                      className={
                        flaggedCols.has(ci)
                          ? styles.colTrashBtnActive
                          : styles.colTrashBtn
                      }
                      onClick={() => toggleCol(ci)}
                      aria-label={
                        flaggedCols.has(ci)
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
            {hiddenCount > 0 && !expanded && (
              <tr className={styles.ellipsisRow}>
                <td colSpan={COLUMNS.length + 1}>
                  <button
                    type="button"
                    className={styles.ellipsisBtn}
                    onClick={() => setExpanded(true)}
                  >
                    Іще {hiddenCount.toLocaleString()} рядів &mdash; клацніть
                    тут, аби розгорнути їх
                  </button>
                </td>
              </tr>
            )}

            {bottomRows.length > 0 &&
              renderRows(bottomRows, dataRows.length - PREVIEW_COUNT)}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ── Row renderer ── */
  function renderRows(rows: string[][], startOffset: number) {
    return rows.map((row, localIndex) => {
      const globalRowIndex = skipRows + startOffset + localIndex;
      const isRowFlagged = flaggedRows.has(globalRowIndex);
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
          {row.map((cell, ci) => (
            <td
              key={ci}
              className={
                flaggedCols.has(ci) && !isRowFlagged
                  ? styles.tdFlagged
                  : undefined
              }
              title={cell}
            >
              {cell}
            </td>
          ))}
        </tr>
      );
    });
  }
}
