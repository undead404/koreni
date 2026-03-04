'use client';
import { ErrorMessage } from '@hookform/error-message';
import posthog from 'posthog-js';
import { useCallback, useEffect, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import parseCsvToObjects, {
  type TableData,
} from '@/app/helpers/parse-csv-file';
import { initBugsnag } from '@/app/services/bugsnag';

import Modal from '../modal';

import TableEditor from './table-editor';
import type { ContributeFormValues } from './types';

import styles from './table-info-fields.module.css';

interface TableInfoFieldsProperties {
  onFileChange: () => void;
  onTableSave: (data: TableData) => void;
  table: TableData | null;
}

export default function TableInfoFields({
  onFileChange,
  onTableSave,
  table,
}: TableInfoFieldsProperties) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<ContributeFormValues>();
  const [isEditorSaved, setIsEditorSaved] = useState(true);
  const file = useWatch({ control, name: 'table' });
  useEffect(() => {
    if (!file?.[0]) return;
    parseCsvToObjects(file[0])
      .then(onTableSave)
      .catch((error) => {
        // Notify Bugsnag and Posthog
        console.error(error);
        posthog.capture('table_info_parse_error', {
          error: error instanceof Error ? error.message : String(error),
        });
        posthog.capture('contribution_error', {
          error: 'Не вдалося розібрати файл таблиці',
        });
        initBugsnag().notify(error as Error);
      });
  }, [file, onTableSave]);
  const [isTableEditorOpen, setIsTableEditorOpen] = useState(false);
  const showTableEditor = useCallback(() => {
    setIsEditorSaved(false);
    setIsTableEditorOpen(true);
  }, []);
  const hideTableEditor = useCallback(
    (force?: boolean) => {
      if (
        force ||
        isEditorSaved ||
        confirm(
          'Ви впевнені, що хочете закрити редагування таблиці, втративши незбережені зміни?',
        )
      ) {
        setIsTableEditorOpen(false);
        setIsEditorSaved(true);
      }
    },
    [isEditorSaved],
  );
  const handleTableEditorSave = useCallback(
    (updatedData: TableData) => {
      onTableSave(updatedData);
      setIsEditorSaved(true);
      hideTableEditor(true);
    },
    [hideTableEditor, onTableSave],
  );
  return (
    <>
      <div className={styles.field}>
        <label htmlFor="table" className={styles.label}>
          Файл таблиці у форматі CSV (UTF-8)
        </label>
        <p id="table-desc" className={styles.description}>
          Поки що ми не приймаємо файли у інших форматах (наприклад, Excel).
          Експортуйте таблицю в форматі CSV (UTF-8). Перший рядок має містити{' '}
          <b>заголовки стовпців</b>.
        </p>
        <input
          id="table"
          type="file"
          accept=".csv"
          {...register('table', {
            required: true,
            onChange: onFileChange,
          })}
          aria-describedby="table-desc"
          className={styles.input}
        />
        <ErrorMessage errors={errors} name="table" />
      </div>
      {table && (
        <button type="button" onClick={showTableEditor}>
          Вдосконалити таблицю перед поданням
        </button>
      )}
      <Modal
        className={styles.tableEditorModal}
        isOpen={isTableEditorOpen}
        onClose={hideTableEditor}
        title="Вдосконалення таблиці"
      >
        {table && <TableEditor onSave={handleTableEditorSave} table={table} />}
      </Modal>

      <div className={styles.field}>
        <label htmlFor="title" className={styles.label}>
          Назва таблиці
        </label>
        <p id="title-desc" className={styles.description}>
          Повна описова назва, яка буде відображатися на сайті.
        </p>
        <input
          autoComplete="on"
          id="title"
          type="text"
          {...register('title', {
            required: true,
            minLength: 10,
            maxLength: 256,
          })}
          aria-describedby="title-desc"
          className={styles.input}
          placeholder="Перепис населення с. Андрушки 1897"
        />
        <ErrorMessage errors={errors} name="title" />
      </div>

      <div className={styles.field}>
        <label htmlFor="id" className={styles.label}>
          Унікальний ID
        </label>
        <p id="id-desc" className={styles.description}>
          Детальний ідентифікатор латиницею, наприклад:{' '}
          <code>DAKhmO-315-1-8563-Antonivka</code>.
        </p>
        <input
          autoComplete="on"
          id="id"
          type="text"
          {...register('id', {
            required: true,
            pattern: {
              value: /^[a-z\-0-9]+$/i,
              message: 'Лише латинські літери, цифри та дефіси',
            },
            minLength: 5,
            maxLength: 128,
          })}
          aria-describedby="id-desc"
          className={styles.input}
          placeholder="e.g. 1897-andrushky"
        />
        <ErrorMessage errors={errors} name="id" />
      </div>

      <div className={styles.field}>
        <label htmlFor="tableLocale" className={styles.label}>
          Мова таблиці
        </label>
        <p id="tableLocale-desc" className={styles.description}>
          Код мови, якою написані дані в таблиці.
        </p>
        <select
          id="tableLocale"
          defaultValue=""
          {...register('tableLocale', { required: true })}
          aria-describedby="tableLocale-desc"
          className={styles.input}
        >
          <option value="" disabled>
            Оберіть мову
          </option>
          <option value="pl">Польська</option>
          <option value="uk">Українська</option>
          <option value="ru">Російська</option>
        </select>
      </div>
    </>
  );
}
