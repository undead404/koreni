import { describe, expect, it } from 'vitest';

import skipFromTable from './skip-from-table';

describe('skipFromTable', () => {
  it('should skip rows above', () => {
    const tableData = [
      ['a', 'b', 'c'],
      ['d', 'e', 'f'],
      ['g', 'h', 'i'],
    ];
    const result = skipFromTable(tableData, {
      skippedRowsAbove: 1,
      skippedRowsElsewhere: new Set(),
      skippedColumns: new Set(),
    });
    expect(result).toEqual([['g', 'h', 'i']]);
  });

  it('should skip rows elsewhere', () => {
    const tableData = [
      ['a', 'b', 'c'],
      ['d', 'e', 'f'],
      ['g', 'h', 'i'],
    ];
    const result = skipFromTable(tableData, {
      skippedRowsAbove: 0,
      skippedRowsElsewhere: new Set([1]),
      skippedColumns: new Set(),
    });
    expect(result).toEqual([['g', 'h', 'i']]);
  });

  it('should skip columns', () => {
    const tableData = [
      ['a', 'b', 'c'],
      ['d', 'e', 'f'],
      ['g', 'h', 'i'],
    ];
    const result = skipFromTable(tableData, {
      skippedRowsAbove: 0,
      skippedRowsElsewhere: new Set(),
      skippedColumns: new Set([1]),
    });
    expect(result).toEqual([
      ['d', 'f'],
      ['g', 'i'],
    ]);
  });
  it('should correctly skip multiple rows', () => {
    const tableData = [
      ['a', 'b', 'c'],
      ['d', 'e', 'f'],
      ['g', 'h', 'i'],
      ['j', 'k', 'l'],
    ];
    const result = skipFromTable(tableData, {
      skippedRowsAbove: 1,
      skippedRowsElsewhere: new Set([2]),
      skippedColumns: new Set(),
    });
    expect(result).toEqual([['j', 'k', 'l']]);
  });

  it('should correctly skip multiple columns', () => {
    const tableData = [
      ['a', 'b', 'c'],
      ['d', 'e', 'f'],
      ['g', 'h', 'i'],
    ];
    const result = skipFromTable(tableData, {
      skippedRowsAbove: 0,
      skippedRowsElsewhere: new Set(),
      skippedColumns: new Set([0, 2]),
    });
    expect(result).toEqual([['e'], ['h']]);
  });
});
