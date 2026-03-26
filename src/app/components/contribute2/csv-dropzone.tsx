'use client';
import { ErrorMessage } from '@hookform/error-message';
import { CheckCircle2, FileSpreadsheet, Upload } from 'lucide-react';
import posthog from 'posthog-js';
import {
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
  useCallback,
  useRef,
  useState,
} from 'react';
import { useFormContext } from 'react-hook-form';

import formatBytes from '@/app/helpers/format-bytes';
import isCsvFile from '@/app/helpers/is-csv-file';
import parseCsvToTuples from '@/app/helpers/parse-csv-file-to-tuples';
import { initBugsnag } from '@/app/services/bugsnag';

import { useContributionStateStore } from './contribution-state';
import { useTableStateStore } from './table-state';
import type { DropzoneState, ParsedFile } from './types';

import styles from './csv-dropzone.module.css';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

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
  const { setState: setContributionState } = useContributionStateStore();

  /* ── Process file ── */
  const processFile = useCallback(
    async (file: File) => {
      if (!isCsvFile(file)) {
        setState('error-type');
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setState('error-size');
        return;
      }

      setState('uploading');

      try {
        const data = await parseCsvToTuples(file);
        setTableData(data);
        setParsedFile({ name: file.name, size: file.size });
        setTableFileName(file.name);
        setState('success');
      } catch (error) {
        setState('error-parse');
        console.error(error);
        posthog.capture('table_info_parse_error', {
          error: error instanceof Error ? error.message : String(error),
        });
        posthog.capture('contribution_error', {
          error: 'Не вдалося розібрати файл таблиці',
        });
        initBugsnag().notify(error as Error);
      } finally {
        setContributionState({
          error: '',
          isSubmitting: false,
          prUrl: '',
          stage: 'idle',
          title: '',
        });
      }
    },
    [setContributionState, setTableData, setTableFileName],
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
      if (file) {
        void processFile(file);
      }
    },
    [processFile, setValue, state],
  );

  /* ── Click / input handler ── */
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        void processFile(file);
      }
    },
    [processFile],
  );

  const handleClick = useCallback(() => {
    if (state === 'uploading') return;
    if (state === 'success') return;
    inputReference.current?.click();
  }, [state]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
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

  const isError = state.startsWith('error');

  return (
    <div aria-live="polite">
      <div
        className={zoneClass}
        role="button"
        tabIndex={state === 'success' ? -1 : 0}
        aria-label="Оберіть файл CSV"
        aria-expanded={state === 'success'}
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

        {/* Idle / drag-over / error */}
        {(state === 'idle' || state === 'drag-over' || isError) && (
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
            {isError && (
              <p className={styles.error}>
                {state === 'error-type' &&
                  'Невірний формат файлу. Будь ласка, завантажте CSV.'}
                {state === 'error-size' &&
                  'Файл занадто великий. Максимальний розмір 50 МіБ.'}
                {state === 'error-parse' && 'Помилка при читанні файлу.'}
              </p>
            )}
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
            <p className={styles.hint}>
              Переходьте далі та заповніть решту полів
            </p>
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
