import type { Dataset, ListItem } from 'schema-dts';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { IndexationTable } from '@/shared/schemas/indexation-table';

import { generateJsonLd } from './table-json-ld';

// Mock dependencies
vi.mock('../environment', () => ({
  default: {
    NEXT_PUBLIC_SITE: 'https://koreni.test',
  },
}));

vi.mock('../helpers/generate-table-description', () => ({
  default: vi.fn((t) => `Description for ${t.id}`),
}));

vi.mock('../helpers/parse-person', () => ({
  default: vi.fn((author) => ({ name: author, '@type': 'Person' })),
}));

describe('generateJsonLd', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate empty JSON-LD if tablesMetadata is empty', () => {
    const result = generateJsonLd([]);

    const mainEntity = (result['@graph'] as any)[0].mainEntity;

    expect(mainEntity.numberOfItems).toBe(0);
    expect(mainEntity.itemListElement).toEqual([]);
  });

  it('should generate correct JSON-LD for a single table', () => {
    const table: IndexationTable = {
      authorName: 'Author Name',
      date: new Date('2023-01-01'),
      id: 'table-1',
      location: [50, 30],
      size: 100,
      sources: ['source-1', 'source-2'],
      tableFilePath: 'public/csv/table-1.csv',
      tableLocale: 'uk',
      title: 'Test Table',
      yearsRange: [1900, 1910],
    };

    const result = generateJsonLd([table]);

    const mainEntity = (result['@graph'] as any)[0].mainEntity;
    const item = mainEntity.itemListElement[0] as ListItem;
    const dataset = item.item as Dataset;

    expect(mainEntity.numberOfItems).toBe(1);
    expect(dataset['@type']).toBe('Dataset');
    expect(dataset.name).toBe('Test Table');
    expect(dataset.identifier).toBe('table-1');
    expect(dataset.datePublished).toBe(new Date('2023-01-01').toISOString());
    expect(dataset.creator).toEqual({ name: 'Author Name', '@type': 'Person' });
    expect(item.position).toBe(1);
    expect(item.url).toBe('https://koreni.test/table-1/1/');
  });

  it('should handle invalid date gracefully', () => {
    const table: IndexationTable = {
      id: 'table-2',
      date: 'invalid-date',
    } as unknown as IndexationTable;

    const result = generateJsonLd([table]);

    const mainEntity = (result['@graph'] as any)[0].mainEntity;
    const dataset = (mainEntity.itemListElement[0] as ListItem).item as Dataset;

    expect(dataset.datePublished).toBeUndefined();
  });
});
