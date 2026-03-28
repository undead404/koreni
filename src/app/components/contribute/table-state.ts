import posthog from 'posthog-js';
import { create } from 'zustand';

import { DEFAULT_PREVIEW_SIZE } from './constants';
import craftInitialTableState from './craft-initial-table-state';
import skipFromTable from './skip-from-table';
/**
 * Zustand state to hold table state:
 * - table data
 * - number of rows skipped above (before the header)
 * - indexes of rows skipped elsewhere
 * - indexes of columns skipped
 *
 * This state is used in table adjustment (edited) and table submission (read).
 */

export interface TableState {
  rowsShownAbove: number;
  rowsShownBelow: number;
  tableData: string[][];
  skippedRowsAbove: number;
  skippedRowsElsewhere: Set<number>;
  skippedColumns: Set<number>;
  tableFileName: string;
}

interface TableStateActions {
  getAllColumns: (includeSkipped?: boolean) => string[];
  getTableAsObjects: (includeSkipped?: boolean) => Record<string, unknown>[];
  getTableDimensions: (includeSkipped?: boolean) => {
    rows: number;
    columns: number;
  };
  reset: () => void;
  setTableData: (tableData: string[][]) => void;
  setTableFileName: (tableFileName: string) => void;
  setSkippedRowsAbove: (skippedRowsAbove: number) => void;
  toggleColumn: (skippedColumnIndex: number) => void;
  toggleRow: (skippedRowIndex: number) => void;
}

export type TableStateStore = TableState & TableStateActions;

export const useTableStateStore = create<TableStateStore>((set, get) => ({
  getAllColumns: (includeSkipped: boolean = false) => {
    const { tableData, skippedColumns, skippedRowsAbove } = get();
    const table = tableData.slice(skippedRowsAbove);
    if (table.length === 0) return [];
    if (includeSkipped) return table[0];
    return table[0].filter((_, index) => !skippedColumns.has(index));
  },
  getTableAsObjects: (includeSkipped: boolean = false) => {
    const {
      getAllColumns,
      tableData,
      skippedRowsAbove,
      skippedRowsElsewhere,
      skippedColumns,
    } = get();
    const table = tableData.slice(skippedRowsAbove);
    let [, ...data] = table;
    const headers = getAllColumns(includeSkipped);

    if (!includeSkipped) {
      data = skipFromTable(tableData, {
        skippedRowsAbove,
        skippedRowsElsewhere,
        skippedColumns,
      });
    }
    return data.map((row) =>
      Object.fromEntries(headers.map((h, index) => [h, row[index]])),
    );
  },
  getTableDimensions: (includeSkipped: boolean = false) => {
    const {
      tableData,
      skippedRowsAbove,
      skippedRowsElsewhere,
      skippedColumns,
    } = get();
    if (tableData.length === 0) return { rows: 0, columns: 0 };
    if (includeSkipped) {
      return {
        rows: tableData.length,
        columns: tableData[0].length,
      };
    }
    return {
      rows: tableData.length - skippedRowsAbove - skippedRowsElsewhere.size,
      columns: tableData[0].length - skippedColumns.size,
    };
  },
  reset: () => {
    set(craftInitialTableState([]));
  },
  rowsShownAbove: DEFAULT_PREVIEW_SIZE,
  rowsShownBelow: DEFAULT_PREVIEW_SIZE,
  setSkippedRowsAbove: (skippedRowsAbove: number) => {
    set({
      skippedRowsAbove,
    });
  },
  setTableData: (tableData: string[][]) => {
    set(craftInitialTableState(tableData));
  },
  setTableFileName: (tableFileName: string) => {
    set({ tableFileName });
  },
  skippedRowsAbove: 0,
  skippedRowsElsewhere: new Set(),
  skippedColumns: new Set(),
  tableData: [],
  tableFileName: '',
  toggleColumn: (skippedColumnIndex: number) => {
    set((state) => {
      const { skippedColumns } = state;
      posthog.capture('table_column_toggled', {
        column_index: skippedColumnIndex,
      });
      const next = new Set(skippedColumns);
      if (next.has(skippedColumnIndex)) next.delete(skippedColumnIndex);
      else next.add(skippedColumnIndex);
      return {
        ...state,
        skippedColumns: next,
      };
    });
  },

  toggleRow: (skippedRowIndex: number) => {
    set((state) => {
      const { skippedRowsElsewhere } = state;
      posthog.capture('table_row_toggled', {
        row_index: skippedRowIndex,
      });
      const next = new Set(skippedRowsElsewhere);
      if (next.has(skippedRowIndex)) next.delete(skippedRowIndex);
      else next.add(skippedRowIndex);
      return {
        ...state,
        skippedRowsElsewhere: next,
      };
    });
  },
}));
