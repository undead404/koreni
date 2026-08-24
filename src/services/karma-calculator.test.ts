import { beforeEach, describe, expect, it, vi } from 'vitest';

import getTablesMetadata from '../shared/get-tables-metadata.js';
import readCsv from '../shared/read-csv-data.js';

import {
  calculateKarmaContributions,
  getUserKarmaContribution,
} from './karma-calculator.js';

vi.mock('../shared/get-tables-metadata.js', () => ({
  default: vi.fn(),
}));

vi.mock('../shared/read-csv-data.js', () => ({
  default: vi.fn(),
}));

describe('karma-calculator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateKarmaContributions', () => {
    it('calculates contribution character counts per normalized author email', async () => {
      vi.mocked(getTablesMetadata).mockResolvedValueOnce([
        {
          archiveItems: ['Archive-1'],
          authorName: 'John Doe',
          authorEmail: '  JOHN.DOE@EXAMPLE.COM ',
          date: new Date(),
          id: 'table-1',
          tableFilePath: 'data/csv/table-1.csv',
          location: [0, 0],
          size: 10,
          sources: ['Source'],
          title: 'Normal Table',
          tableLocale: 'uk',
          yearsRange: [1897],
        },
      ]);

      vi.mocked(readCsv).mockResolvedValueOnce([
        { name: 'Іван', surname: 'Коваленко' },
        { name: 'Іван', surname: 'Петренко' },
      ]);

      const totals = await calculateKarmaContributions();

      // Unique values: 'Іван' (4 chars), 'Коваленко' (9 chars), 'Петренко' (8 chars)
      // Total = 4 + 9 + 8 = 21
      expect(totals.get('john.doe@example.com')).toBe(21);
    });

    it('deduplicates identical non-empty cell values within the same table', async () => {
      vi.mocked(getTablesMetadata).mockResolvedValueOnce([
        {
          archiveItems: ['Archive-1'],
          authorName: 'Jane Smith',
          authorEmail: 'jane@example.com',
          date: new Date(),
          id: 'table-dup',
          tableFilePath: 'data/csv/table-dup.csv',
          location: [0, 0],
          size: 10,
          sources: ['Source'],
          title: 'Deduplication Test',
          tableLocale: 'uk',
          yearsRange: [1897],
        },
      ]);

      vi.mocked(readCsv).mockResolvedValueOnce([
        { col1: 'same', col2: 'same' },
        { col1: 'same', col2: 'different' },
      ]);

      const totals = await calculateKarmaContributions();

      // Unique values: 'same' (4 chars), 'different' (9 chars)
      // Total = 4 + 9 = 13
      expect(totals.get('jane@example.com')).toBe(13);
    });

    it('applies 0.1 weight factor (floored) for AI tables starting with [ШІ] or [ШI]', async () => {
      vi.mocked(getTablesMetadata).mockResolvedValueOnce([
        {
          archiveItems: ['Archive-1'],
          authorName: 'AI Author',
          authorEmail: 'ai@example.com',
          date: new Date(),
          id: 'table-ai-cyrillic',
          tableFilePath: 'data/csv/table-ai-cyrillic.csv',
          location: [0, 0],
          size: 10,
          sources: ['Source'],
          title: '[ШІ] Cyrillic AI Table',
          tableLocale: 'uk',
          yearsRange: [1897],
        },
        {
          archiveItems: ['Archive-2'],
          authorName: 'AI Author',
          authorEmail: 'ai@example.com',
          date: new Date(),
          id: 'table-ai-latin',
          tableFilePath: 'data/csv/table-ai-latin.csv',
          location: [0, 0],
          size: 10,
          sources: ['Source'],
          title: '[ШI] Latin AI Table',
          tableLocale: 'uk',
          yearsRange: [1897],
        },
      ]);

      // Table 1: 35 characters -> Math.floor(35 * 0.1) = 3
      vi.mocked(readCsv).mockResolvedValueOnce([
        { col: '12345678901234567890123456789012345' },
      ]);
      // Table 2: 49 characters -> Math.floor(49 * 0.1) = 4
      vi.mocked(readCsv).mockResolvedValueOnce([
        { col: '1234567890123456789012345678901234567890123456789' },
      ]);

      const totals = await calculateKarmaContributions();

      expect(totals.get('ai@example.com')).toBe(7); // 3 + 4
    });

    it('aggregates totals across multiple tables for the same author email', async () => {
      vi.mocked(getTablesMetadata).mockResolvedValueOnce([
        {
          archiveItems: ['Archive-1'],
          authorName: 'Multi Table Author',
          authorEmail: 'multi@example.com',
          date: new Date(),
          id: 'table-m1',
          tableFilePath: 'data/csv/m1.csv',
          location: [0, 0],
          size: 10,
          sources: ['Source'],
          title: 'Table 1',
          tableLocale: 'uk',
          yearsRange: [1897],
        },
        {
          archiveItems: ['Archive-2'],
          authorName: 'Multi Table Author',
          authorEmail: 'MULTI@EXAMPLE.COM',
          date: new Date(),
          id: 'table-m2',
          tableFilePath: 'data/csv/m2.csv',
          location: [0, 0],
          size: 10,
          sources: ['Source'],
          title: 'Table 2',
          tableLocale: 'uk',
          yearsRange: [1897],
        },
      ]);

      vi.mocked(readCsv).mockResolvedValueOnce([{ val: 'aaaaa' }]); // 5
      vi.mocked(readCsv).mockResolvedValueOnce([{ val: 'bbbbbb' }]); // 6

      const totals = await calculateKarmaContributions();

      expect(totals.get('multi@example.com')).toBe(11);
    });

    it('filters out falsy, empty string, and whitespace-only cell values', async () => {
      vi.mocked(getTablesMetadata).mockResolvedValueOnce([
        {
          archiveItems: ['Archive-1'],
          authorName: 'Filter Test',
          authorEmail: 'filter@example.com',
          date: new Date(),
          id: 'table-filter',
          tableFilePath: 'data/csv/filter.csv',
          location: [0, 0],
          size: 10,
          sources: ['Source'],
          title: 'Filter Table',
          tableLocale: 'uk',
          yearsRange: [1897],
        },
      ]);

      vi.mocked(readCsv).mockResolvedValueOnce([
        { col1: '', col2: '   ', col3: null, col4: undefined },
        { col1: 'valid', col2: 12_345, col3: true },
      ]);

      const totals = await calculateKarmaContributions();

      // Unique values: 'valid' (5), '12345' (5), 'true' (4)
      // Total = 5 + 5 + 4 = 14
      expect(totals.get('filter@example.com')).toBe(14);
    });

    it('ignores tables without authorEmail or with empty authorEmail', async () => {
      vi.mocked(getTablesMetadata).mockResolvedValueOnce([
        {
          archiveItems: ['Archive-1'],
          authorName: 'No Email',
          authorEmail: undefined,
          date: new Date(),
          id: 'table-no-email',
          tableFilePath: 'data/csv/no-email.csv',
          location: [0, 0],
          size: 10,
          sources: ['Source'],
          title: 'No Email Table',
          tableLocale: 'uk',
          yearsRange: [1897],
        },
        {
          archiveItems: ['Archive-2'],
          authorName: 'Space Email',
          authorEmail: '   ',
          date: new Date(),
          id: 'table-space-email',
          tableFilePath: 'data/csv/space-email.csv',
          location: [0, 0],
          size: 10,
          sources: ['Source'],
          title: 'Space Email Table',
          tableLocale: 'uk',
          yearsRange: [1897],
        },
      ]);

      const totals = await calculateKarmaContributions();

      expect(totals.size).toBe(0);
      expect(readCsv).not.toHaveBeenCalled();
    });

    it('handles CSV reading errors gracefully by skipping the table', async () => {
      vi.mocked(getTablesMetadata).mockResolvedValueOnce([
        {
          archiveItems: ['Archive-1'],
          authorName: 'Error Author',
          authorEmail: 'error@example.com',
          date: new Date(),
          id: 'table-error',
          tableFilePath: 'data/csv/missing.csv',
          location: [0, 0],
          size: 10,
          sources: ['Source'],
          title: 'Missing File Table',
          tableLocale: 'uk',
          yearsRange: [1897],
        },
      ]);

      vi.mocked(readCsv).mockRejectedValueOnce(new Error('File not found'));

      const totals = await calculateKarmaContributions();

      expect(totals.get('error@example.com')).toBeUndefined();
    });
  });

  describe('getUserKarmaContribution', () => {
    it('returns the total karma contribution for a normalized email', async () => {
      vi.mocked(getTablesMetadata).mockResolvedValueOnce([
        {
          archiveItems: ['Archive-1'],
          authorName: 'User Test',
          authorEmail: 'user@example.com',
          date: new Date(),
          id: 'table-user',
          tableFilePath: 'data/csv/user.csv',
          location: [0, 0],
          size: 10,
          sources: ['Source'],
          title: 'User Table',
          tableLocale: 'uk',
          yearsRange: [1897],
        },
      ]);

      vi.mocked(readCsv).mockResolvedValueOnce([{ col: '1234567890' }]); // 10 chars

      const score = await getUserKarmaContribution('  USER@EXAMPLE.COM  ');

      expect(score).toBe(10);
    });

    it('returns 0 for an email not found or an empty email string', async () => {
      vi.mocked(getTablesMetadata).mockResolvedValue([
        {
          archiveItems: ['Archive-1'],
          authorName: 'User Test',
          authorEmail: 'user@example.com',
          date: new Date(),
          id: 'table-user',
          tableFilePath: 'data/csv/user.csv',
          location: [0, 0],
          size: 10,
          sources: ['Source'],
          title: 'User Table',
          tableLocale: 'uk',
          yearsRange: [1897],
        },
      ]);
      vi.mocked(readCsv).mockResolvedValue([{ col: '12345' }]);

      expect(await getUserKarmaContribution('unknown@example.com')).toBe(0);
      expect(await getUserKarmaContribution('')).toBe(0);
      expect(await getUserKarmaContribution('   ')).toBe(0);
    });
  });
});
