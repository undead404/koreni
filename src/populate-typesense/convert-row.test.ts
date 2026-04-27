import { describe, expect, it, vi } from 'vitest';

import type { IndexationTable } from '@/shared/schemas/indexation-table.js';

import convertRow from './convert-row.js';
import determineRowYear from './determine-row-year.js';

vi.mock('./determine-row-year.js', () => ({
  default: vi.fn(),
}));

describe('convertRow', () => {
  const mockTable: IndexationTable = {
    archiveItems: [],
    authorEmail: 'john@example.com',
    authorName: 'John Doe',
    date: new Date('2023-01-01'),
    id: 'test-table-123',
    location: [50.4501, 30.5234],
    size: 100,
    sources: ['https://example.com/source'],
    tableFilePath: 'data/test-table.csv',
    tableLocale: 'uk',
    title: 'Test Table',
    yearsRange: [1900],
  };

  const mockLocation: [number, number] = [50.4501, 30.5234];

  it('should convert a row correctly', () => {
    vi.mocked(determineRowYear).mockReturnValue(1905);

    const row = {
      Name: ' Ivan ',
      Age: 25,
      Notes: '  Some notes  ',
    };

    const result = convertRow(row, 0, mockTable, mockLocation);

    expect(result).toEqual({
      id: 'test-table-123-1',
      location: mockLocation,
      tableId: 'test-table-123',
      title: 'Test Table',
      year: 1905,
      values: ['Ivan', '25', 'Some notes'],
      raw: row,
    });

    expect(determineRowYear).toHaveBeenCalledWith(row, mockTable);
  });

  it('should handle empty or null values by stringifying and trimming', () => {
    vi.mocked(determineRowYear).mockReturnValue(0);

    const row = {
      Name: 'Petro',
      Age: null,
      Notes: undefined,
      Empty: '',
    };

    const result = convertRow(row, 4, mockTable, mockLocation);

    expect(result.id).toBe('test-table-123-5');
    expect(result.values).toEqual(['Petro', 'null', 'undefined', '']);
    expect(result.raw).toBe(row);
  });
});
