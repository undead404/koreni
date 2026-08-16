'use client';

import { type ReactNode } from 'react';
import { IMaskInput } from 'react-imask';

import type {
  ColumnConfig,
  TranscriptionRow,
} from '../_hooks/use-transcription-rows';

import styles from './transcription-table.module.css';

const REPLACEMENTS: [string, string][] = [
  ['иии', 'ы'],
  ['ььь', 'ъ'],
  ['еее', 'ѣ'],
  ['Ффф', 'Ѳ'],
  ['ФФФ', 'Ѳ'],
  ['ффф', 'ѳ'],
  ['ііі', 'ѵ'],
  ['ІІІ', 'Ѵ'],
  ['ЄЄЄ', 'Э'],
  ['єєє', 'э'],
  ['I', 'І'],
  ['i', 'і'],
];

export function applyReplacements(value: string): string {
  let result = value;
  for (const [search, replace] of REPLACEMENTS) {
    result = result.replaceAll(search, replace);
  }
  return result;
}

export interface CellInputProperties {
  column: ColumnConfig;
  row: TranscriptionRow;
  hasPageName: boolean;
  projectLocale?: string;
  isFirstColumn: boolean;
  onUpdateRow: (id: string, field: string, value: string) => void;
  onReferenceSet: (
    rowId: string,
    element: HTMLInputElement | HTMLTextAreaElement | null,
  ) => void;
}

export function renderCellInput({
  column,
  row,
  hasPageName,
  projectLocale,
  isFirstColumn,
  onUpdateRow,
  onReferenceSet,
}: CellInputProperties): ReactNode {
  switch (column.expectedType) {
    case 'number': {
      return (
        <input
          type="number"
          className={styles.input}
          value={row[column.id] || ''}
          onChange={(event_) => {
            onUpdateRow(row.id, column.id, event_.target.value);
          }}
          placeholder={column.title}
          disabled={!hasPageName}
          ref={
            isFirstColumn
              ? (element) => {
                  onReferenceSet(row.id, element);
                }
              : undefined
          }
        />
      );
    }

    case 'date': {
      return (
        <IMaskInput
          mask="0000[-`0`0[-`0`0]]"
          lazy={false}
          placeholderChar="_"
          overwrite={true}
          className={styles.input}
          value={row[column.id] ?? ''}
          onAccept={(acceptedValue: string) => {
            onUpdateRow(row.id, column.id, acceptedValue);
          }}
          placeholder={column.title}
          disabled={!hasPageName}
          inputRef={
            isFirstColumn
              ? (element) => {
                  onReferenceSet(row.id, element);
                }
              : undefined
          }
        />
      );
    }

    case 'string': {
      return (
        <textarea
          className={styles.input}
          value={row[column.id] || ''}
          onChange={(event_) => {
            const finalValue =
              projectLocale === 'ru'
                ? applyReplacements(event_.target.value)
                : event_.target.value;
            onUpdateRow(row.id, column.id, finalValue);
          }}
          placeholder={column.title}
          disabled={!hasPageName}
          rows={1}
          ref={
            isFirstColumn
              ? (element) => {
                  onReferenceSet(row.id, element);
                }
              : undefined
          }
        />
      );
    }

    default: {
      // Exhaustiveness guard: adding a new ColumnExpectedType without handling
      // it in the cases above will cause a TypeScript compile error here.
      const _exhaustive: never = column.expectedType;
      void _exhaustive;
    }
  }
}
