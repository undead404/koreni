'use client';

import { usePostHog } from 'posthog-js/react';
import {
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  type FieldErrors,
  useFormContext,
  type UseFormRegisterReturn,
} from 'react-hook-form';

import isCsvFile from '@/app/helpers/is-csv-file';
import parseCsvToTuples from '@/app/helpers/parse-csv-file-to-tuples';
import { initBugsnag } from '@/app/services/bugsnag';

import { MAX_FILE_SIZE } from './constants';
import { useContributionStateStore } from './contribution-state';
import { useTableStateStore } from './table-state';
import type { DropzoneState, ParsedFile } from './types';

export interface UseCsvDropzoneResult {
  errors: FieldErrors;
  getTableDimensions: (useFullData?: boolean) => {
    columns: number;
    rows: number;
  };
  handleDragLeave: (event: DragEvent<HTMLDivElement>) => void;
  handleDragOver: (event: DragEvent<HTMLDivElement>) => void;
  handleDrop: (event: DragEvent<HTMLDivElement>) => void;
  handleKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  handleRemove: () => void;
  parseError: string | null;
  parsedFile: ParsedFile | null;
  setReference: (reference: HTMLInputElement | null) => void;
  state: DropzoneState;
  tableInputAttributes: Omit<UseFormRegisterReturn, 'ref'>;
}

const FILE_SIZES = new Map<string, number>();

export function useCsvDropzone(): UseCsvDropzoneResult {
  const {
    formState: { errors },
    register,
    setValue,
  } = useFormContext();
  const inputReference = useRef<HTMLInputElement>(null);
  const { getTableDimensions, setTableData, setTableFileName, tableFileName } =
    useTableStateStore();

  const [parsedFile, setParsedFile] = useState<ParsedFile | null>(() => {
    if (tableFileName) {
      const size = FILE_SIZES.get(tableFileName);
      if (size) {
        return { name: tableFileName, size };
      }
    }
    return null;
  });

  const [state, setState] = useState<DropzoneState>(
    parsedFile ? 'success' : 'idle',
  );
  const [parseError, setParseError] = useState<string | null>(null);
  const { setState: setContributionState } = useContributionStateStore();
  const posthog = usePostHog();

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
      setParseError(null);

      try {
        const data = await parseCsvToTuples(file);

        if (
          data.length > 0 &&
          data[0].some((header) => !header || !header.trim())
        )
          throw new Error('EMPTY_HEADER');

        setTableData(data);
        setParsedFile({ name: file.name, size: file.size });
        FILE_SIZES.set(file.name, file.size);
        setTableFileName(file.name);
        setState('success');
      } catch (error) {
        setValue('table', null);
        setState('error-parse');

        if (error instanceof Error) {
          if (error.message === 'EMPTY_HEADER') {
            setParseError(
              'Таблиця містить колонки без заголовків. Будь ласка, додайте заголовки до всіх колонок.',
            );
            return;
          }
          if (error.message.includes('Invalid byte sequence detected')) {
            setParseError(
              'Таблиця містить некоректне кодування символів. Будь ласка, експортуйте таблицю у форматі CSV з кодуванням UTF-8.',
            );
            return;
          }
        }

        setParseError('Помилка при читанні файлу.');

        posthog.capture('table_info_parse_error', {
          error: error instanceof Error ? error.message : String(error),
        });
        posthog.capture('contribution_error', {
          error: 'Не вдалося розібрати файл таблиці',
        });
        initBugsnag().notify(error as Error);
      } finally {
        setContributionState({
          activeIndex: 0,
          error: '',
          isSubmitting: false,
          prUrl: '',
          stage: 'idle',
          title: '',
        });
      }
    },
    [posthog, setContributionState, setTableData, setTableFileName, setValue],
  );

  /* ── Remove file ── */
  const handleRemove = useCallback(() => {
    setState('idle');
    setParsedFile(null);
    setParseError(null);
    setValue('table', null);
    if (inputReference.current) inputReference.current.value = '';
    posthog.capture('csv_file_removed');
  }, [posthog, setValue]);

  /* ── Drag handlers ── */
  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setState((previous) => (previous === 'uploading' ? previous : 'drag-over'));
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
      if (state === 'uploading') return;
      const files = event.dataTransfer.files;
      setValue('table', files);
      if (inputReference.current) inputReference.current.files = files;
      posthog.capture('csv_file_dropped', { file_name: files[0].name });
      void processFile(files[0]);
    },
    [posthog, processFile, setValue, state],
  );

  /* ── Click / input handler ── */
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        posthog.capture('csv_file_selected', { file_name: file.name });
        void processFile(file);
      } else handleRemove();
    },
    [posthog, processFile, handleRemove],
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

  /* ── Cancel handler ── */
  useEffect(() => {
    const input = inputReference.current;
    if (!input) return;
    input.addEventListener('cancel', handleRemove);
    return () => {
      input.removeEventListener('cancel', handleRemove);
    };
  }, [handleRemove]);

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

  return {
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
  };
}
