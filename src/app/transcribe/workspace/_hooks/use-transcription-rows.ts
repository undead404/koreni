import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod';

import getProjectImage from '../../api/get-project-image';
import requestApi from '../../api/request';

export type ColumnExpectedType = 'string' | 'number';

export interface ColumnConfig {
  id: string;
  title: string;
  hint: string;
  expectedType: ColumnExpectedType;
  isExtended?: boolean;
}

export interface TranscriptionRow extends Record<string, string> {
  id: string;
}

function buildRowArraySchema(columns: ColumnConfig[]) {
  const columnFields = Object.fromEntries(
    columns.map((column) => [column.id, z.string()]),
  );
  const rowSchema = z.object({ id: z.uuid(), ...columnFields });
  return z.array(rowSchema);
}

export function useTranscriptionRows(
  columns: ColumnConfig[],
  projectId: string | null,
  imageId: string | undefined,
) {
  const rowArraySchema = useMemo(() => buildRowArraySchema(columns), [columns]);

  const createEmptyRow = useCallback((): TranscriptionRow => {
    const row: TranscriptionRow = { id: crypto.randomUUID() };
    for (const column of columns) {
      row[column.id] = '';
    }
    return row;
  }, [columns]);

  const [rows, setRows] = useState<TranscriptionRow[]>(() => [
    createEmptyRow(),
  ]);
  const [isHydrating, setIsHydrating] = useState(false);

  const lastSavedReference = useRef<string>('');
  const rowsReference = useRef<TranscriptionRow[]>(rows);

  useEffect(() => {
    rowsReference.current = rows;
  }, [rows]);

  const saveTranscription = useCallback(
    async (isUnloading = false) => {
      if (!projectId || !imageId) return;

      const currentSerialized = JSON.stringify(rowsReference.current);
      if (currentSerialized === lastSavedReference.current) return;

      try {
        const response = await requestApi(
          `/api/transcribe/projects/${projectId}/images/${imageId}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ transcription: currentSerialized }),
            keepalive: isUnloading,
          },
        );

        if (response.ok) {
          lastSavedReference.current = currentSerialized;
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to save transcription:', error);
      }
    },
    [projectId, imageId],
  );

  // Interval Auto-Save: 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      void saveTranscription();
    }, 120_000);

    return () => {
      clearInterval(interval);
    };
  }, [saveTranscription]);

  // Window Close Save
  useEffect(() => {
    const handleUnload = () => {
      void saveTranscription(true);
    };

    window.addEventListener('pagehide', handleUnload);
    globalThis.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        void saveTranscription();
      }
    });

    return () => {
      window.removeEventListener('pagehide', handleUnload);
    };
  }, [saveTranscription]);

  // Hydrate rows from DB when imageId changes
  useEffect(() => {
    const emptyRow = createEmptyRow();

    if (!imageId || !projectId) {
      setRows([emptyRow]);
      lastSavedReference.current = '';
      setIsHydrating(false);
      return;
    }

    setRows([emptyRow]);
    lastSavedReference.current = '';
    setIsHydrating(true);

    const abortController = new AbortController();
    let cancelled = false;

    async function hydrate() {
      try {
        const image = await getProjectImage(
          projectId as string,
          imageId as string,
          abortController.signal,
        );

        if (cancelled) return;

        let finalRows: TranscriptionRow[];

        if (image.transcription) {
          try {
            const parsed: unknown = JSON.parse(image.transcription);
            const result = rowArraySchema.safeParse(parsed);
            finalRows = result.success
              ? (result.data as TranscriptionRow[])
              : [createEmptyRow()];
          } catch {
            finalRows = [createEmptyRow()];
          }
        } else {
          finalRows = [createEmptyRow()];
        }

        setRows(finalRows);
        lastSavedReference.current = JSON.stringify(finalRows);
      } catch {
        // Network error — keep the optimistic empty row already set above
      } finally {
        if (!cancelled) {
          setIsHydrating(false);
        }
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [imageId, projectId, createEmptyRow, rowArraySchema]);

  const addRow = (index?: number): string => {
    const newRow = createEmptyRow();
    setRows((previous) => {
      if (index === undefined) {
        return [...previous, newRow];
      }
      const newRows = [...previous];
      newRows.splice(index, 0, newRow);
      return newRows;
    });
    return newRow.id;
  };

  const deleteRow = (id: string) => {
    setRows((previous) => previous.filter((row) => row.id !== id));
  };

  const updateRow = (id: string, field: string, value: string) => {
    setRows((previous) =>
      previous.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  };

  return {
    rows,
    isHydrating,
    addRow,
    deleteRow,
    updateRow,
  };
}
