import { useReducer } from 'react';

import type { TableData } from '@/app/helpers/parse-csv-file';

export const ROW_STEP_SIZE = 5;

interface TableEditorState {
  excludedColumns: string[];
  excludedRows: number[];
  shownAbove: number;
  shownBelow: number;
}

interface ToggleColumnAction {
  type: 'toggle-column';
  column: string;
}

interface ToggleRowAction {
  type: 'toggle-row';
  row: number;
}

interface ShowMoreOnTopAction {
  type: 'show-more-on-top';
}
interface ShowMoreOnBottomAction {
  type: 'show-more-on-bottom';
}

type TableEditorAction =
  | ToggleColumnAction
  | ToggleRowAction
  | ShowMoreOnTopAction
  | ShowMoreOnBottomAction;

export default function useTableEditor(tableData: TableData) {
  return useReducer(
    (state: TableEditorState, action: TableEditorAction) => {
      switch (action.type) {
        case 'toggle-column': {
          return {
            ...state,
            excludedColumns: state.excludedColumns.includes(action.column)
              ? state.excludedColumns.filter((c) => c !== action.column)
              : [...state.excludedColumns, action.column],
          };
        }
        case 'toggle-row': {
          return {
            ...state,
            excludedRows: state.excludedRows.includes(action.row)
              ? state.excludedRows.filter((r) => r !== action.row)
              : [...state.excludedRows, action.row],
          };
        }
        case 'show-more-on-top': {
          return {
            ...state,
            shownAbove: state.shownAbove + ROW_STEP_SIZE,
          };
        }
        case 'show-more-on-bottom': {
          return {
            ...state,
            shownBelow: state.shownBelow + ROW_STEP_SIZE,
          };
        }
        default: {
          throw new Error('Unknown action type');
        }
      }
    },
    {
      excludedColumns: tableData.columns.filter((columnName) =>
        tableData.data.every(
          (row) => !row[columnName] || row[columnName] === '-',
        ),
      ),
      excludedRows: tableData.data
        .map((row, index) => index)
        .filter((index) =>
          Object.values(tableData.data[index]).every(
            (value) => !value || value === '-',
          ),
        ),
      shownAbove: ROW_STEP_SIZE,
      shownBelow: ROW_STEP_SIZE,
    },
  );
}
