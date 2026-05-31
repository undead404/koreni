import { useCallback, useEffect, useRef, useState } from 'react';

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

export function useTranscriptionRows(
  columns: ColumnConfig[],
  projectId: string | null,
  imageId: string | undefined,
) {
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
        const response = await fetch(
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

  // Reset rows and lastSavedReference when imageId changes
  useEffect(() => {
    if (imageId) {
      setRows([createEmptyRow()]);
      lastSavedReference.current = '';
    }
  }, [imageId, createEmptyRow]);

  const addRow = (index?: number) => {
    setRows((previous) => {
      const newRow = createEmptyRow();
      if (index === undefined) {
        return [...previous, newRow];
      }
      const newRows = [...previous];
      newRows.splice(index, 0, newRow);
      return newRows;
    });
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
    addRow,
    deleteRow,
    updateRow,
  };
}
