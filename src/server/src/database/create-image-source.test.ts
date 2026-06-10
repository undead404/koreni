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
    const mockTrx = {
      execute: vi.fn().mockResolvedValue({ rows: [] }),
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
    expect(mockTrx.execute).toHaveBeenCalledOnce();
  });

  it('throws "Source ID already exists" on UNIQUE constraint violation', async () => {
    const uniqueError = Object.assign(new Error('UNIQUE constraint failed'), {
      code: 'SQLITE_CONSTRAINT_UNIQUE',
    });

    const mockTrx = {
      execute: vi.fn().mockRejectedValue(uniqueError),
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
    const mockTrx = {
      execute: vi.fn().mockRejectedValue(new Error('Connection lost')),
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
