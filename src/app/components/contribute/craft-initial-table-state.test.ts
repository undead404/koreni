import { describe, expect,it } from 'vitest';

import craftInitialTableState from './craft-initial-table-state';

describe('craftInitialTableState', () => {
  it('should handle a basic table without skipping anything', () => {
    const table = [
      ['Name', 'Age', 'City'],
      ['Alice', '30', 'Kyiv'],
      ['Bob', '25', 'Lviv'],
    ];
    const result = craftInitialTableState(table);
    
    expect(result.skippedRowsAbove).toBe(0);
    expect(result.skippedRowsElsewhere.size).toBe(0);
    expect(result.skippedColumns.size).toBe(0);
    expect(result.tableData).toBe(table);
    expect(result.tableFileName).toBe('');
  });

  it('should skip rows that are entirely empty or contain only "-"', () => {
    const table = [
      ['Name', 'Age'],
      ['', ''], // Row 0 (relative to data rows)
      ['Alice', '30'], // Row 1
      ['-', '-'], // Row 2
      ['Bob', '25'], // Row 3
    ];
    const result = craftInitialTableState(table);
    
    expect(result.skippedRowsElsewhere).toEqual(new Set([0, 2]));
  });

  it('should skip columns where all unskipped rows have the same value', () => {
    const table = [
      ['Name', 'Country', 'Status'],
      ['Alice', 'Ukraine', 'Active'],
      ['Bob', 'Ukraine', 'Active'],
      ['Charlie', 'Ukraine', 'Inactive'],
    ];
    const result = craftInitialTableState(table);
    
    // 'Country' (index 1) is 'Ukraine' for all rows, so it should be skipped.
    // 'Status' (index 2) changes, so it should not be skipped.
    expect(result.skippedColumns).toEqual(new Set([1]));
  });

  it('should handle empty tables gracefully', () => {
    const table: string[][] = [];
    const result = craftInitialTableState(table);
    
    expect(result.skippedRowsElsewhere.size).toBe(0);
    expect(result.skippedColumns.size).toBe(0);
    expect(result.tableData).toBe(table);
  });

  it('should handle tables with only headers gracefully', () => {
    const table = [['Name', 'Age', 'City']];
    const result = craftInitialTableState(table);
    
    expect(result.skippedRowsElsewhere.size).toBe(0);
    expect(result.skippedColumns.size).toBe(0);
    expect(result.tableData).toBe(table);
  });
});
