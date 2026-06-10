'use client';

import { clsx } from 'clsx';
import { Info, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import Modal from '@/app/components/modal';

import type {
  ColumnConfig,
  TranscriptionRow,
} from '../_hooks/use-transcription-rows';

import { renderCellInput } from './cell-input';

import styles from './transcription-table.module.css';

interface TranscriptionTableProperties {
  columns: ColumnConfig[];
  rows: TranscriptionRow[];
  hasPageName: boolean;
  projectLocale?: string;
  onAddRow: (index?: number) => string;
  onDeleteRow: (id: string) => void;
  onUpdateRow: (id: string, field: string, value: string) => void;
}

export default function TranscriptionTable({
  columns,
  rows,
  hasPageName,
  projectLocale,
  onAddRow,
  onDeleteRow,
  onUpdateRow,
}: TranscriptionTableProperties) {
  const [pendingFocusRowId, setPendingFocusRowId] = useState<string | null>(
    null,
  );
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const handleConfirmDelete = useCallback(() => {
    if (pendingDeleteId !== null) {
      onDeleteRow(pendingDeleteId);
    }
    setPendingDeleteId(null);
  }, [pendingDeleteId, onDeleteRow]);

  const handleCancelDelete = useCallback(() => {
    setPendingDeleteId(null);
  }, []);

  const firstCellReferences = useRef<
    Map<string, HTMLInputElement | HTMLTextAreaElement>
  >(new Map());

  useEffect(() => {
    if (pendingFocusRowId === null) return;
    const element = firstCellReferences.current.get(pendingFocusRowId);
    if (element) {
      element.focus();
      element.select();
      setPendingFocusRowId(null);
    }
  }, [pendingFocusRowId, rows]);

  const firstColumnId = columns[0]?.id;

  const handleReferenceSet = useCallback(
    (rowId: string, element: HTMLInputElement | HTMLTextAreaElement | null) => {
      if (element) {
        firstCellReferences.current.set(rowId, element);
      } else {
        firstCellReferences.current.delete(rowId);
      }
    },
    [],
  );

  return (
    <>
      <div className={styles.tableHeader}>
        <h2>Транскрипція</h2>
      </div>

      <div className={styles.tableContainer}>
        <table
          className={clsx(styles.table, { [styles.disabled]: !hasPageName })}
        >
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={
                    column.isExtended
                      ? styles.columnExtended
                      : styles.columnDefault
                  }
                >
                  <div className={styles.columnHeader}>
                    {column.title}
                    {column.hint && (
                      <span className={styles.hint} title={column.hint}>
                        <Info size={14} />
                      </span>
                    )}
                  </div>
                </th>
              ))}
              <th style={{ width: '60px' }}>Дії</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id}>
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className={
                      column.isExtended
                        ? styles.columnExtended
                        : styles.columnDefault
                    }
                  >
                    {renderCellInput({
                      column,
                      row,
                      hasPageName,
                      projectLocale,
                      isFirstColumn: column.id === firstColumnId,
                      onUpdateRow,
                      onReferenceSet: handleReferenceSet,
                    })}
                  </td>
                ))}
                <td className={styles.actionCell}>
                  <button
                    className={styles.insertRowButton}
                    onClick={() => {
                      const newId = onAddRow(index);
                      setPendingFocusRowId(newId);
                    }}
                    title="Додати рядок вище"
                    disabled={!hasPageName}
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    className={styles.deleteButton}
                    onClick={() => {
                      setPendingDeleteId(row.id);
                    }}
                    title="Видалити"
                    disabled={!hasPageName}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className={styles.emptyState}>
            Натисніть &quot;Додати рядок&quot;, щоб почати транскрибування.
          </div>
        )}
        <div
          style={{
            marginTop: '1rem',
            display: 'flex',
            justifyContent: 'flex-start',
          }}
        >
          <button
            className={styles.addButton}
            onClick={() => {
              const newId = onAddRow();
              setPendingFocusRowId(newId);
            }}
            disabled={!hasPageName}
          >
            <Plus size={16} />
            Додати рядок
          </button>
        </div>
      </div>
      <Modal
        isOpen={pendingDeleteId !== null}
        onClose={handleCancelDelete}
        title="Видалити рядок?"
      >
        <p className={styles.confirmMessage}>Цю дію неможливо скасувати.</p>
        <div className={styles.confirmActions}>
          <button
            className={styles.confirmCancelButton}
            onClick={handleCancelDelete}
          >
            Скасувати
          </button>
          <button
            className={styles.confirmDeleteButton}
            onClick={handleConfirmDelete}
          >
            Видалити
          </button>
        </div>
      </Modal>
    </>
  );
}
