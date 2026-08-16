import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./client.js', () => ({
  default: {
    transaction: vi.fn(),
  },
}));

import database from './client.js';
import { createImageSource } from './create-image-source.js';

describe('createImageSource', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('executes an INSERT within a transaction', async () => {
    const mockInsertQuery = {
      values: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue({ rows: [] }),
    };

    const mockTrx = {
      insertInto: vi.fn().mockReturnValue(mockInsertQuery),
    };

    (database.transaction as any).mockReturnValue({
      execute: vi.fn((callback: any) => callback(mockTrx)),
    });

    await createImageSource({
      id: 'src-1',
      projectId: 'proj-1',
      storageKey: 'projects/proj-1/sources/src-1.jpg',
      width: 800,
      height: 600,
      blurhash: 'LKO2?U%2Tw=w',
    });

    expect(database.transaction).toHaveBeenCalledOnce();
    expect(mockTrx.insertInto).toHaveBeenCalledOnce();
    expect(mockInsertQuery.values).toHaveBeenCalledOnce();
    expect(mockInsertQuery.execute).toHaveBeenCalledOnce();
  });

  it('throws "Source ID already exists" on UNIQUE constraint violation', async () => {
    const uniqueError = Object.assign(new Error('UNIQUE constraint failed'), {
      code: 'SQLITE_CONSTRAINT_UNIQUE',
    });

    const mockInsertQuery = {
      values: vi.fn().mockReturnThis(),
      execute: vi.fn().mockRejectedValue(uniqueError),
    };

    const mockTrx = {
      insertInto: vi.fn().mockReturnValue(mockInsertQuery),
    };

    (database.transaction as any).mockReturnValue({
      execute: vi.fn((callback: any) => callback(mockTrx)),
    });

    await expect(
      createImageSource({
        id: 'src-1',
        projectId: 'proj-1',
        storageKey: 'projects/proj-1/sources/src-1.jpg',
        width: 800,
        height: 600,
        blurhash: 'LKO2?U%2Tw=w',
      }),
    ).rejects.toThrow('Source ID already exists');
  });

  it('re-throws unknown errors', async () => {
    const mockInsertQuery = {
      values: vi.fn().mockReturnThis(),
      execute: vi.fn().mockRejectedValue(new Error('Connection lost')),
    };

    const mockTrx = {
      insertInto: vi.fn().mockReturnValue(mockInsertQuery),
    };

    (database.transaction as any).mockReturnValue({
      execute: vi.fn((callback: any) => callback(mockTrx)),
    });

    await expect(
      createImageSource({
        id: 'src-1',
        projectId: 'proj-1',
        storageKey: 'projects/proj-1/sources/src-1.jpg',
        width: 800,
        height: 600,
        blurhash: 'LKO2?U%2Tw=w',
      }),
    ).rejects.toThrow('Connection lost');
  });
});
