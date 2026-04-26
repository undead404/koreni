import { act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { useTableStateStore } from './table-state';

// Mock dependencies
vi.mock('posthog-js', () => ({
  __esModule: true,
  default: {
    capture: vi.fn(),
  },
}));

vi.mock('./craft-initial-table-state', () => ({
  __esModule: true,
  default: vi.fn((tableData: string[][]) => ({
    tableData,
    skippedRowsAbove: 0,
    skippedRowsElsewhere: new Set<number>(),
    skippedColumns: new Set<number>(),
  })),
}));

vi.mock('./skip-from-table', () => ({
  __esModule: true,
  default: vi.fn((tableData: string[][], { skippedRowsAbove, skippedRowsElsewhere, skippedColumns }) => {
    // A simplified mock implementation of skipFromTable for testing purposes
    const data = tableData.slice(skippedRowsAbove + 1); // +1 to skip header
    return data
      .filter((_, index) => !skippedRowsElsewhere.has(index + skippedRowsAbove + 1))
      .map(row => row.filter((_, colIndex) => !skippedColumns.has(colIndex)));
  }),
}));

describe('useTableStateStore', () => {
  const sampleTableData = [
    ['Header1', 'Header2', 'Header3'],
    ['Row1Col1', 'Row1Col2', 'Row1Col3'],
    ['Row2Col1', 'Row2Col2', 'Row2Col3'],
  ];

  beforeEach(() => {
    // Reset the store before each test
    act(() => {
      useTableStateStore.getState().reset();
      useTableStateStore.getState().setTableData([]);
      useTableStateStore.getState().setTableFileName('');
    });
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const state = useTableStateStore.getState();
    expect(state.tableData).toEqual([]);
    expect(state.skippedRowsAbove).toBe(0);
    expect(state.skippedRowsElsewhere.size).toBe(0);
    expect(state.skippedColumns.size).toBe(0);
    expect(state.tableFileName).toBe('');
  });

  it('should set table data', () => {
    act(() => {
      useTableStateStore.getState().setTableData(sampleTableData);
    });
    expect(useTableStateStore.getState().tableData).toEqual(sampleTableData);
  });

  it('should set table file name', () => {
    act(() => {
      useTableStateStore.getState().setTableFileName('test.csv');
    });
    expect(useTableStateStore.getState().tableFileName).toBe('test.csv');
  });

  it('should set skipped rows above', () => {
    act(() => {
      useTableStateStore.getState().setSkippedRowsAbove(2);
    });
    expect(useTableStateStore.getState().skippedRowsAbove).toBe(2);
  });

  it('should toggle columns correctly', () => {
    act(() => {
      useTableStateStore.getState().toggleColumn(1);
    });
    expect(useTableStateStore.getState().skippedColumns.has(1)).toBe(true);

    act(() => {
      useTableStateStore.getState().toggleColumn(1);
    });
    expect(useTableStateStore.getState().skippedColumns.has(1)).toBe(false);
  });

  it('should toggle rows correctly', () => {
    act(() => {
      useTableStateStore.getState().toggleRow(2);
    });
    expect(useTableStateStore.getState().skippedRowsElsewhere.has(2)).toBe(true);

    act(() => {
      useTableStateStore.getState().toggleRow(2);
    });
    expect(useTableStateStore.getState().skippedRowsElsewhere.has(2)).toBe(false);
  });

  it('should get all columns considering skipped rows above and skipped columns', () => {
    act(() => {
      useTableStateStore.getState().setTableData(sampleTableData);
      useTableStateStore.getState().toggleColumn(1); // Skip 'Header2'
    });

    const columnsWithoutSkipped = useTableStateStore.getState().getAllColumns(false);
    expect(columnsWithoutSkipped).toEqual(['Header1', 'Header3']);

    const allColumns = useTableStateStore.getState().getAllColumns(true);
    expect(allColumns).toEqual(['Header1', 'Header2', 'Header3']);
  });

  it('should get table dimensions correctly', () => {
    act(() => {
      useTableStateStore.getState().setTableData(sampleTableData);
      useTableStateStore.getState().setSkippedRowsAbove(1);
      useTableStateStore.getState().toggleColumn(1);
    });

    const dimensionsWithoutSkipped = useTableStateStore.getState().getTableDimensions(false);
    expect(dimensionsWithoutSkipped).toEqual({ rows: 2, columns: 2 });

    const allDimensions = useTableStateStore.getState().getTableDimensions(true);
    expect(allDimensions).toEqual({ rows: 3, columns: 3 });
  });

  it('should get table as objects correctly', () => {
    act(() => {
      useTableStateStore.getState().setTableData(sampleTableData);
      useTableStateStore.getState().toggleColumn(1); // Skip column 1
    });

    const objectsWithoutSkipped = useTableStateStore.getState().getTableAsObjects(false);
    expect(objectsWithoutSkipped).toEqual([
      { Header1: 'Row1Col1', Header3: 'Row1Col3' },
      { Header1: 'Row2Col1', Header3: 'Row2Col3' },
    ]);

    const allObjects = useTableStateStore.getState().getTableAsObjects(true);
    expect(allObjects).toEqual([
      { Header1: 'Row1Col1', Header2: 'Row1Col2', Header3: 'Row1Col3' },
      { Header1: 'Row2Col1', Header2: 'Row2Col2', Header3: 'Row2Col3' },
    ]);
  });
});
