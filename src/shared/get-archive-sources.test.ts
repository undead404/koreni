import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { IndexationTable } from './schemas/indexation-table';
import getArchiveSources from './get-archive-sources';
import getTablesMetadata from './get-tables-metadata';

vi.mock('./get-tables-metadata');

function buildTable(overrides: Partial<IndexationTable>): IndexationTable {
  return {
    archiveItems: ['ДАКО-1-1-1'],
    authorName: 'Author',
    date: new Date('2025-01-01'),
    id: 't',
    location: [50, 30],
    size: 100,
    sources: ['https://example.com'],
    tableFilePath: 'data/records/t.csv',
    tableLocale: 'uk',
    title: 'Table',
    yearsRange: [1900],
    ...overrides,
  };
}

describe('getArchiveSources', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns one source per unique archive item with referencing table', async () => {
    vi.mocked(getTablesMetadata).mockResolvedValue([
      buildTable({
        id: 't1',
        title: 'Table 1',
        archiveItems: ['ДАКО-384-10-242'],
      }),
    ]);

    const result = await getArchiveSources();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      archive: 'ДАКО',
      fond: '384',
      opys: '10',
      sprava: '242',
      tables: [{ id: 't1', title: 'Table 1' }],
    });
  });

  it('merges archive items whose raw forms normalize to the same key', async () => {
    vi.mocked(getTablesMetadata).mockResolvedValue([
      buildTable({
        id: 't1',
        title: 'Table 1',
        archiveItems: ['ДАВіО-Р6023-1-'],
      }),
      buildTable({
        id: 't2',
        title: 'Table 2',
        archiveItems: ['ДАВіО-Р-6023-1-'],
      }),
    ]);

    const result = await getArchiveSources();

    expect(result).toHaveLength(1);
    expect(result[0].tables.map((t) => t.id)).toStrictEqual(['t1', 't2']);
  });

  it('deduplicates the same table appearing twice for the same source', async () => {
    vi.mocked(getTablesMetadata).mockResolvedValue([
      buildTable({
        id: 't1',
        title: 'Table 1',
        archiveItems: ['ДАКО-1-1-1', 'ДАКО-1-1-1'],
      }),
    ]);

    const result = await getArchiveSources();

    expect(result[0].tables).toStrictEqual([{ id: 't1', title: 'Table 1' }]);
  });

  it('merges yearsRange across tables sharing a source', async () => {
    vi.mocked(getTablesMetadata).mockResolvedValue([
      buildTable({
        id: 't1',
        archiveItems: ['ДАКО-1-1-1'],
        yearsRange: [1900],
      }),
      buildTable({
        id: 't2',
        archiveItems: ['ДАКО-1-1-1'],
        yearsRange: [1910, 1920],
      }),
    ]);

    const result = await getArchiveSources();

    expect(result[0].yearsRange).toStrictEqual([1900, 1920]);
  });

  it('sorts by archive, then numerically by fond, opys, sprava', async () => {
    vi.mocked(getTablesMetadata).mockResolvedValue([
      buildTable({ id: 'a', archiveItems: ['ДАКО-1-1-100'] }),
      buildTable({ id: 'b', archiveItems: ['ДАКО-1-1-9'] }),
      buildTable({ id: 'c', archiveItems: ['ДАЖО-1-1-1'] }),
    ]);

    const result = await getArchiveSources();

    expect(result.map((s) => s.raw)).toStrictEqual([
      'ДАЖО-1-1-1',
      'ДАКО-1-1-9',
      'ДАКО-1-1-100',
    ]);
  });

  it('places unparsed sources after parsed ones', async () => {
    vi.mocked(getTablesMetadata).mockResolvedValue([
      buildTable({ id: 'a', archiveItems: ['AGAD 298/151'] }),
      buildTable({ id: 'b', archiveItems: ['ДАКО-1-1-1'] }),
    ]);

    const result = await getArchiveSources();

    expect(result.map((s) => s.archive)).toStrictEqual(['ДАКО', '']);
  });
});
