import { describe, expect, it, vi } from 'vitest';

import type { IndexationTable } from '@/shared/schemas/indexation-table.js';

import convertRow from '../populate-typesense/convert-row.js';
import determineRowYear from '../populate-typesense/determine-row-year.js';

import {
  PL_COLLECTION_CONFIGURATION,
  RU_COLLECTION_CONFIGURATION,
  UK_COLLECTION_CONFIGURATION,
} from './config';

vi.mock('../populate-typesense/determine-row-year.js', () => ({
  default: vi.fn(),
}));

describe('typesense collection configuration', () => {
  const table: IndexationTable = {
    archiveItems: ['Test archive item'],
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

  const row = {
    Age: 25,
    Name: ' Ivan ',
    Notes: '  Some notes  ',
  };

  it.each([
    ['Polish', PL_COLLECTION_CONFIGURATION],
    ['Russian', RU_COLLECTION_CONFIGURATION],
    ['Ukrainian', UK_COLLECTION_CONFIGURATION],
  ] as const)(
    'keeps the %s collection compatible with imported row documents',
    (_label, configuration) => {
      vi.mocked(determineRowYear).mockReturnValue(1905);

      const document = convertRow(row, 0, table, table.location);
      const schemaFieldNames = configuration.fields.map((field) => field.name);
      const importedFieldNames = Object.keys(document).filter(
        (fieldName) => fieldName !== 'id',
      );

      expect(schemaFieldNames).toEqual(
        expect.arrayContaining(importedFieldNames),
      );
    },
  );
});
