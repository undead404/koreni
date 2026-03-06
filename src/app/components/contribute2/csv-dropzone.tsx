'use client';

import { CheckCircle2, FileSpreadsheet, Upload } from 'lucide-react';
import {
  type ChangeEvent,
  type DragEvent,
  useCallback,
  useRef,
  useState,
} from 'react';

import styles from './csv-dropzone.module.css';

/* ────────────────────────────────────────── */
/*  Types                                      */
/* ────────────────────────────────────────── */

type DropzoneState = 'idle' | 'drag-over' | 'uploading' | 'success';

interface ParsedFile {
  name: string;
  size: number;
}

interface CsvDropzoneProperties {
  onFileAccepted?: (file: File) => void;
}

/* ────────────────────────────────────────── */
/*  Helpers                                    */
/* ────────────────────────────────────────── */

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isCsvFile(file: File): boolean {
  return file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv');
}

/* ────────────────────────────────────────── */
/*  Component                                  */
/* ────────────────────────────────────────── */

export default function CsvDropzone({ onFileAccepted }: CsvDropzoneProperties) {
  const [state, setState] = useState<DropzoneState>('idle');
  const [parsedFile, setParsedFile] = useState<ParsedFile | null>(null);
  const inputReference = useRef<HTMLInputElement>(null);

  /* ── Process file ── */
  const processFile = useCallback(
    (file: File) => {
      if (!isCsvFile(file)) return;

      setState('uploading');

      // Simulate upload / parse time
      setTimeout(() => {
        setParsedFile({ name: file.name, size: file.size });
        setState('success');
        onFileAccepted?.(file);
      }, 1800);
    },
    [onFileAccepted],
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

      const file = event.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile, state],
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
    if (inputReference.current) inputReference.current.value = '';
  }, []);

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
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        {/* Hidden file input */}
        <input
          ref={inputReference}
          type="file"
          accept=".csv,text/csv"
          className={styles.hiddenInput}
          onChange={handleChange}
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
        {(state === 'idle' || state === 'drag-over') && (
          <>
            <p
              className={
                state === 'drag-over' ? styles.mainText : styles.mainText
              }
            >
              {state === 'drag-over' ? (
                'Drop your CSV file here'
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
