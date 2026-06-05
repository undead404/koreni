'use client';
import { ErrorMessage } from '@hookform/error-message';
import { clsx } from 'clsx';
import { CheckCircle2, FileSpreadsheet, Upload } from 'lucide-react';

import formatBytes from '@/app/helpers/format-bytes';

import { useCsvDropzone } from './use-csv-dropzone';

import styles from './csv-dropzone.module.css';

export default function CsvDropzone() {
  const {
    errors,
    getTableDimensions,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleKeyDown,
    handleRemove,
    parseError,
    parsedFile,
    setReference,
    state,
    tableInputAttributes,
  } = useCsvDropzone();

  /* ── Style selection ── */
  const zoneClass = clsx(styles.dropzone, {
    [styles.dropzoneDragOver]: state === 'drag-over',
    [styles.dropzoneUploading]: state === 'uploading',
    [styles.dropzoneSuccess]: state === 'success',
  });

  const iconClass = clsx(styles.iconWrapper, {
    [styles.iconWrapperDragOver]: state === 'drag-over',
    [styles.iconWrapperUploading]: state === 'uploading',
    [styles.iconWrapperSuccess]: state === 'success',
  });

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
        <input
          type="file"
          accept=".csv,text/csv"
          {...tableInputAttributes}
          ref={setReference}
          className={styles.hiddenInput}
          tabIndex={-1}
          aria-hidden="true"
        />

        <div className={iconClass} aria-hidden="true">
          {state === 'success' ? (
            <CheckCircle2 size={20} strokeWidth={2} />
          ) : state === 'uploading' ? (
            <FileSpreadsheet size={20} strokeWidth={2} />
          ) : (
            <Upload size={20} strokeWidth={2} />
          )}
        </div>

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
                {state === 'error-parse' &&
                  (parseError || 'Помилка при читанні файлу.')}
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

        {state === 'uploading' && (
          <>
            <div className={styles.spinner} aria-hidden="true" />
            <p className={styles.spinnerLabel}>Розбирання файлу&hellip;</p>
          </>
        )}

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
              <span>{getTableDimensions(true).rows} рядків</span>
              <span>{getTableDimensions(true).columns} колонок</span>
            </div>
          </>
        )}
      </div>

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
