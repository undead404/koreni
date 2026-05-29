import { useState } from 'react';

export interface TranscriptionRow {
  id: string;
  lastName: string;
  firstName: string;
  yearOrAge: string;
  notes: string;
}

export function useTranscriptionRows() {
  const [rows, setRows] = useState<TranscriptionRow[]>([
    {
      id: crypto.randomUUID(),
      lastName: '',
      firstName: '',
      yearOrAge: '',
      notes: '',
    },
  ]);

  const addRow = () => {
    setRows((previous) => [
      ...previous,
      {
        id: crypto.randomUUID(),
        lastName: '',
        firstName: '',
        yearOrAge: '',
        notes: '',
      },
    ]);
  };

  const deleteRow = (id: string) => {
    setRows((previous) => previous.filter((row) => row.id !== id));
  };

  const updateRow = (
    id: string,
    field: keyof TranscriptionRow,
    value: string,
  ) => {
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
