import { beforeEach, describe, expect, it, vi } from 'vitest';

import calculatePayloadSizeInBytes from './calculate-payload-size-in-bytes';
import importBatch from './import-batch';
import type { RowForImport } from './types';
import typesense from './typesense';

vi.mock('./calculate-payload-size-in-bytes');

const mockImport = vi.fn();

vi.mock('./typesense', () => {
  return {
    default: {
      collections: vi.fn(() => ({
        documents: vi.fn(() => ({
          import: mockImport,
        })),
      })),
    },
  };
});

describe('importBatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console logs and errors during tests to keep output clean
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should import a batch successfully when size is within limit', async () => {
    vi.mocked(calculatePayloadSizeInBytes).mockReturnValue(500_000);
    mockImport.mockResolvedValue([{ success: true }, { success: true }]);

    const batch = [{ id: '1' }, { id: '2' }] as RowForImport[];
    const result = await importBatch('test-collection', batch);

    expect(result).toBe(2);
    expect(mockImport).toHaveBeenCalledWith(batch, { action: 'upsert' });
    expect(typesense.collections).toHaveBeenCalledWith('test-collection');
  });

  it('should split the batch if size exceeds limit', async () => {
    // First call: size > 1_000_000
    // Subsequent calls: size < 1_000_000
    vi.mocked(calculatePayloadSizeInBytes)
      .mockReturnValueOnce(1_500_000)
      .mockReturnValueOnce(500_000)
      .mockReturnValueOnce(500_000);

    mockImport.mockResolvedValue([{ success: true }]);

    const batch = [{ id: '1' }, { id: '2' }] as RowForImport[];
    const result = await importBatch('test-collection', batch);

    expect(result).toBe(2);
    expect(mockImport).toHaveBeenCalledTimes(2);
    expect(mockImport).toHaveBeenNthCalledWith(1, [{ id: '1' }], { action: 'upsert' });
    expect(mockImport).toHaveBeenNthCalledWith(2, [{ id: '2' }], { action: 'upsert' });
  });

  it('should throw an error if a single record exceeds the size limit', async () => {
    vi.mocked(calculatePayloadSizeInBytes).mockReturnValue(1_500_000);

    const batch = [{ id: '1' }] as RowForImport[];
    await expect(importBatch('test-collection', batch)).rejects.toThrow(
      'Single-record batch is too big: 1500000 > 1000000',
    );
  });

  it('should throw an error if typesense import fails for some records', async () => {
    vi.mocked(calculatePayloadSizeInBytes).mockReturnValue(500_000);
    mockImport.mockResolvedValue([
      { success: true },
      { success: false, error: 'Bad data' },
    ]);

    const batch = [{ id: '1' }, { id: '2' }] as RowForImport[];
    await expect(importBatch('test-collection', batch)).rejects.toThrow(
      'Failed to import 1 records.',
    );
  });

  it('should throw an error if typesense returns fewer results than expected', async () => {
    vi.mocked(calculatePayloadSizeInBytes).mockReturnValue(500_000);
    mockImport.mockResolvedValue([{ success: true }]);

    const batch = [{ id: '1' }, { id: '2' }] as RowForImport[];
    await expect(importBatch('test-collection', batch)).rejects.toThrow(
      'Failed to import 1 records.',
    );
  });
});
