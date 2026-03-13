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
    expect(result).toEqual({
      headers: ['d', 'e', 'f'],
      data: [['g', 'h', 'i']],
    });
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
    expect(result).toEqual({
      headers: ['a', 'b', 'c'],
      data: [['g', 'h', 'i']],
    });
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
    expect(result).toEqual({
      headers: ['a', 'c'],
      data: [
        ['d', 'f'],
        ['g', 'i'],
      ],
    });
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
    expect(result).toEqual({
      headers: ['d', 'e', 'f'],
      data: [['j', 'k', 'l']],
    });
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
    expect(result).toEqual({
      headers: ['b'],
      data: [['e'], ['h']],
    });
  });
});
