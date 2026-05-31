import { clsx } from 'clsx';
import { Info, Plus, Trash2 } from 'lucide-react';

import type {
  ColumnConfig,
  TranscriptionRow,
} from '../_hooks/use-transcription-rows';

import styles from './transcription-table.module.css';

interface TranscriptionTableProperties {
  columns: ColumnConfig[];
  rows: TranscriptionRow[];
  hasPageName: boolean;
  projectLocale?: string;
  onAddRow: (index?: number) => void;
  onDeleteRow: (id: string) => void;
  onUpdateRow: (id: string, field: string, value: string) => void;
}

const REPLACEMENTS: [string, string][] = [
  ['иии', 'ы'],
  ['ььь', 'ъ'],
  ['еее', 'ѣ'],
  ['Ффф', 'Ѳ'],
  ['ФФФ', 'Ѳ'],
  ['ффф', 'ѳ'],
  ['ііі', 'ѵ'],
  ['ІІІ', 'Ѵ'],
  ['ЄЄЄ', 'Э'],
  ['єєє', 'э'],
  ['I', 'І'],
  ['i', 'і'],
];

function applyReplacements(value: string): string {
  let result = value;
  for (const [search, replace] of REPLACEMENTS) {
    result = result.replaceAll(search, replace);
  }
  return result;
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
                    <input
                      type={
                        column.expectedType === 'number' ? 'number' : 'text'
                      }
                      className={styles.input}
                      value={row[column.id] || ''}
                      onChange={(event_) => {
                        const finalValue =
                          projectLocale === 'ru'
                            ? applyReplacements(event_.target.value)
                            : event_.target.value;
                        onUpdateRow(row.id, column.id, finalValue);
                      }}
                      placeholder={column.title}
                      disabled={!hasPageName}
                    />
                  </td>
                ))}
                <td className={styles.actionCell}>
                  <button
                    className={styles.insertRowButton}
                    onClick={() => {
                      onAddRow(index);
                    }}
                    title="Додати рядок вище"
                    disabled={!hasPageName}
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    className={styles.deleteButton}
                    onClick={() => {
                      onDeleteRow(row.id);
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
              onAddRow();
            }}
            disabled={!hasPageName}
          >
            <Plus size={16} />
            Додати рядок
          </button>
        </div>
      </div>
    </>
  );
}
