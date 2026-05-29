import { Plus, Trash2 } from 'lucide-react';

import type { TranscriptionRow } from '../_hooks/use-transcription-rows';

import styles from '../page.module.css';

interface TranscriptionTableProperties {
  rows: TranscriptionRow[];
  hasPageName: boolean;
  onAddRow: () => void;
  onDeleteRow: (id: string) => void;
  onUpdateRow: (
    id: string,
    field: keyof TranscriptionRow,
    value: string,
  ) => void;
}

export default function TranscriptionTable({
  rows,
  hasPageName,
  onAddRow,
  onDeleteRow,
  onUpdateRow,
}: TranscriptionTableProperties) {
  return (
    <>
      <div className={styles.tableHeader}>
        <h2>Транскрипція</h2>
        <button
          className={styles.addButton}
          onClick={onAddRow}
          disabled={!hasPageName}
        >
          <Plus size={16} />
          Додати рядок
        </button>
      </div>

      <div className={styles.tableContainer}>
        <table
          className={`${styles.table} ${hasPageName ? '' : styles.disabled}`}
        >
          <thead>
            <tr>
              <th style={{ width: '40px' }}>No.</th>
              <th>Прізвище</th>
              <th>Ім&apos;я</th>
              <th>Рік народження / Вік</th>
              <th>Примітки</th>
              <th style={{ width: '60px' }}>Дії</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id}>
                <td className={styles.indexCell}>{index + 1}</td>
                <td>
                  <input
                    type="text"
                    className={styles.input}
                    value={row.lastName}
                    onChange={(event_) => {
                      onUpdateRow(row.id, 'lastName', event_.target.value);
                    }}
                    placeholder="Прізвище"
                    disabled={!hasPageName}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className={styles.input}
                    value={row.firstName}
                    onChange={(event_) => {
                      onUpdateRow(row.id, 'firstName', event_.target.value);
                    }}
                    placeholder="Ім'я"
                    disabled={!hasPageName}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className={styles.input}
                    value={row.yearOrAge}
                    onChange={(event_) => {
                      onUpdateRow(row.id, 'yearOrAge', event_.target.value);
                    }}
                    placeholder="Вік"
                    disabled={!hasPageName}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className={styles.input}
                    value={row.notes}
                    onChange={(event_) => {
                      onUpdateRow(row.id, 'notes', event_.target.value);
                    }}
                    placeholder="Примітки"
                    disabled={!hasPageName}
                  />
                </td>
                <td className={styles.actionCell}>
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
      </div>
    </>
  );
}
