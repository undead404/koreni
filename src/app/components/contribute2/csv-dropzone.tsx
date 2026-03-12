'use client';
import { ErrorMessage } from '@hookform/error-message';
import { CheckCircle2, FileSpreadsheet, Upload } from 'lucide-react';
import posthog from 'posthog-js';
import {
  type ChangeEvent,
  type DragEvent,
  useCallback,
  useRef,
  useState,
} from 'react';
import { useFormContext } from 'react-hook-form';

import parseCsvToTuples from '@/app/helpers/parse-csv-file-to-tuples';
import { initBugsnag } from '@/app/services/bugsnag';

import { useTableStateStore } from './table-state';
import type { DropzoneState, ParsedFile } from './types';

import styles from './csv-dropzone.module.css';

// export interface CsvDropzoneProperties extends StepProperties {
//   onFileAccepted?: (file: File) => void;
// }
/* ────────────────────────────────────────── */
/*  Helpers                                    */
/* ────────────────────────────────────────── */

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КіБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МіБ`;
}

function isCsvFile(file: File): boolean {
  return file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv');
}

/* ────────────────────────────────────────── */
/*  Component                                  */
/* ────────────────────────────────────────── */

export default function CsvDropzone() {
  const [state, setState] = useState<DropzoneState>('idle');
  const [parsedFile, setParsedFile] = useState<ParsedFile | null>(null);
  const {
    formState: { errors },
    register,
    setValue,
  } = useFormContext();
  const inputReference = useRef<HTMLInputElement>(null);
  const { getTableDimensions, setTableData, setTableFileName } =
    useTableStateStore();

  /* ── Process file ── */
  const processFile = useCallback(
    (file: File) => {
      if (!isCsvFile(file)) {
        setState('error');
        return;
      }

      parseCsvToTuples(file)
        .then(setTableData)
        .catch((error: Error) => {
          // Notify Bugsnag and Posthog
          console.error(error);
          posthog.capture('table_info_parse_error', {
            error: error instanceof Error ? error.message : String(error),
          });
          posthog.capture('contribution_error', {
            error: 'Не вдалося розібрати файл таблиці',
          });
          initBugsnag().notify(error);
        })
        .then(() => {
          setParsedFile({ name: file.name, size: file.size });
          setTableFileName(file.name);
          setState('success');
          // onFileAccepted?.(file);
          return;
        })
        .catch((error: Error) => {
          setState('error');
          console.error(error);
        });
    },
    [setTableData, setTableFileName],
  );

  /* ── Drag handlers ── */
  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setState((previous) =>
      previous === 'uploading' || previous === 'success'
        ? previous
        : 'drag-over',
    );
  }, []);

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setState((previous) => (previous === 'drag-over' ? 'idle' : previous));
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (state === 'uploading' || state === 'success') return;
      setValue('table', event.dataTransfer.files);

      const file = event.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile, setValue, state],
  );

  /* ── Click / input handler ── */
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleClick = useCallback(() => {
    if (state === 'uploading') return;
    if (state === 'success') return;
    inputReference.current?.click();
  }, [state]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleClick();
      }
    },
    [handleClick],
  );

  /* ── Remove file ── */
  const handleRemove = useCallback(() => {
    setState('idle');
    setParsedFile(null);
    setValue('table', null);
  }, [setValue]);

  /* ── Style selection ── */
  const zoneClass =
    state === 'drag-over'
      ? styles.dropzoneDragOver
      : state === 'uploading'
        ? styles.dropzoneUploading
        : state === 'success'
          ? styles.dropzoneSuccess
          : styles.dropzone;

  const iconClass =
    state === 'drag-over'
      ? styles.iconWrapperDragOver
      : state === 'uploading'
        ? styles.iconWrapperUploading
        : state === 'success'
          ? styles.iconWrapperSuccess
          : styles.iconWrapper;

  const { ref: rhfReference, ...tableInputAttributes } = register('table', {
    required: true,
    onChange: handleChange,
  });

  const setReference = useCallback(
    (reference: HTMLInputElement | null) => {
      rhfReference(reference);
      inputReference.current = reference;
    },
    [rhfReference],
  );

  return (
    <div>
      <div
        className={zoneClass}
        role="button"
        tabIndex={state === 'success' ? -1 : 0}
        aria-label="Оберіть файл CSV"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onKeyDown={handleKeyDown}
      >
        {/* Hidden file input */}
        <input
          type="file"
          accept=".csv,text/csv"
          {...tableInputAttributes}
          ref={setReference}
          className={styles.hiddenInput}
          tabIndex={-1}
          aria-hidden="true"
        />

        {/* Icon */}
        <div className={iconClass} aria-hidden="true">
          {state === 'success' ? (
            <CheckCircle2 size={20} strokeWidth={2} />
          ) : state === 'uploading' ? (
            <FileSpreadsheet size={20} strokeWidth={2} />
          ) : (
            <Upload size={20} strokeWidth={2} />
          )}
        </div>

        {/* Idle / drag-over */}
        {(state === 'idle' || state === 'drag-over' || state === 'error') && (
          <>
            <p className={styles.mainText}>
              {state === 'drag-over' ? (
                'Перетягніть свій файл CSV сюди'
              ) : (
                <>
                  Перетягніть сюди файл CSV, або{' '}
                  <span className={styles.browse}>
                    клацніть тут, аби обрати його
                  </span>
                </>
              )}
            </p>
            <p className={styles.hint}>
              Приймаються лише файли CSV &middot; До 50 МіБ
            </p>
            <ErrorMessage
              className={styles.error}
              errors={errors}
              name="table"
              as="p"
            />
          </>
        )}

        {/* Uploading */}
        {state === 'uploading' && (
          <>
            <div className={styles.spinner} aria-hidden="true" />
            <p className={styles.spinnerLabel}>Розбирання файлу&hellip;</p>
          </>
        )}

        {/* Success */}
        {state === 'success' && parsedFile && (
          <>
            <p className={styles.mainTextSuccess}>Файл готовий</p>
            <div className={styles.fileInfo}>
              <span className={styles.fileName}>{parsedFile.name}</span>
              <span className={styles.fileDot} aria-hidden="true" />
              <span className={styles.fileSize}>
                {formatBytes(parsedFile.size)}
              </span>
            </div>
            <div className={styles.tableInfo}>
              <span className={styles.tableRows}>
                {getTableDimensions(true).rows} рядків
              </span>
              <span className={styles.tableColumns}>
                {getTableDimensions(true).columns} колонок
              </span>
            </div>
          </>
        )}
      </div>

      {/* Remove link */}
      {state === 'success' && (
        <button
          type="button"
          className={styles.removeBtn}
          onClick={handleRemove}
        >
          Вилучити файл
        </button>
      )}
    </div>
  );
}
