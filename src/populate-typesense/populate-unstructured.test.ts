import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.ADDED_MODIFIED_FILES = '';
  process.env.DELETED_FILES = '';
  process.env.FULL_SYNC = 'false';
});

import convertRow from './convert-row.js';
import importBatch from './import-batch.js';
import populateTypesense from './populate-unstructured.js';
import type { IndexationTableWithData } from './types.js';

vi.mock('./convert-row.js');
vi.mock('./import-batch.js');

describe('populateTypesense', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.log for cleaner test output
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should process and import data successfully', async () => {
    const mockTable: IndexationTableWithData = {
      id: 'table-1',
      title: 'Test Table',
      location: 'test-location',
      tableLocale: 'uk',
      data: [{ col1: 'val1' }, { col1: 'val2' }, { col1: 'val3' }],
    } as unknown as IndexationTableWithData;

    vi.mocked(convertRow).mockImplementation((row, index) => ({
      id: `id-${index}`,
      values: [],
      location: [0, 0],
      tableId: 'table-1',
      title: 'Test Table',
      raw: {},
      year: 2022,
    }));

    // Mock importBatch to return the number of items it processed
    vi.mocked(importBatch).mockResolvedValue(3);

    await populateTypesense(mockTable);

    expect(convertRow).toHaveBeenCalledTimes(3);
    expect(importBatch).toHaveBeenCalledTimes(1);
    expect(importBatch).toHaveBeenCalledWith('unstructured_uk', [
      {
        id: 'id-0',
        values: [],
        location: [0, 0],
        tableId: 'table-1',
        title: 'Test Table',
        raw: {},
        year: 2022,
      },
      {
        id: 'id-1',
        values: [],
        location: [0, 0],
        tableId: 'table-1',
        title: 'Test Table',
        raw: {},
        year: 2022,
      },
      {
        id: 'id-2',
        values: [],
        location: [0, 0],
        tableId: 'table-1',
        title: 'Test Table',
        raw: {},
        year: 2022,
      },
    ]);
  });

  it('should chunk data if it exceeds CHUNK_SIZE', async () => {
    // Create 1500 rows to test chunking (CHUNK_SIZE is 1000)
    const mockData = Array.from({ length: 1500 }).map((_, index) => ({
      val: index,
    }));
    const mockTable: IndexationTableWithData = {
      id: 'table-2',
      title: 'Large Table',
      location: 'test-location',
      tableLocale: 'uk',
      data: mockData,
    } as unknown as IndexationTableWithData;

    vi.mocked(convertRow).mockImplementation((row, index) => ({
      id: `id-${index}`,
      values: [],
      location: [0, 0],
      tableId: 'table-2',
      title: 'Large Table',
      raw: {},
    }));

    // First call processes 1000, second processes 500
    vi.mocked(importBatch)
      .mockResolvedValueOnce(1000)
      .mockResolvedValueOnce(500);

    await populateTypesense(mockTable);

    expect(convertRow).toHaveBeenCalledTimes(1500);
    expect(importBatch).toHaveBeenCalledTimes(2);

    // Check first chunk size
    expect(vi.mocked(importBatch).mock.calls[0][1]).toHaveLength(1000);
    // Check second chunk size
    expect(vi.mocked(importBatch).mock.calls[1][1]).toHaveLength(500);
  });

  it('should throw an error if processed size does not match table size', async () => {
    const mockTable: IndexationTableWithData = {
      id: 'table-3',
      title: 'Error Table',
      location: 'test-location',
      tableLocale: 'uk',
      data: [{ col1: 'val1' }, { col1: 'val2' }],
    } as unknown as IndexationTableWithData;

    vi.mocked(convertRow).mockImplementation((row, index) => ({
      id: `id-${index}`,
      values: [],
      location: 'test-location',
      tableId: 'table-3',
      title: 'Error Table',
    }));

    // Mock importBatch to return fewer processed items than expected
    vi.mocked(importBatch).mockResolvedValue(1);

    await expect(populateTypesense(mockTable)).rejects.toThrow(
      '1 of 2 records were lost somewhere.',
    );
  });
});
