import { useState } from 'react';

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

export function useTranscriptionRows(columns: ColumnConfig[]) {
  const createEmptyRow = (): TranscriptionRow => {
    const row: TranscriptionRow = { id: crypto.randomUUID() };
    for (const column of columns) {
      row[column.id] = '';
    }
    return row;
  };

  const [rows, setRows] = useState<TranscriptionRow[]>(() => [
    createEmptyRow(),
  ]);

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
