import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./client.js', () => ({
  default: {
    transaction: vi.fn(),
  },
}));

import database from './client.js';
import { createDerivedPages } from './create-derived-pages.js';

const mockSource = {
  project_id: 'proj-1',
  storage_key: 'projects/proj-1/sources/src-1.jpg',
  width: 800,
  height: 600,
  blurhash: 'LKO2?U%2Tw=w',
};

const validSplit = {
  sourceId: 'src-1',
  cropX: 0.5,
  leftPageId: 'left-1',
  rightPageId: 'right-1',
  leftPageSequence: 1,
  rightPageSequence: 2,
  leftPageName: null,
  rightPageName: null,
};

describe('createDerivedPages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when source is not found', async () => {
    const mockTrx = {
      execute: vi.fn().mockResolvedValue({ rows: [] }),
    };

    (database.transaction as any).mockReturnValue({
      execute: vi.fn((callback: any) => callback(mockTrx)),
    });

    await expect(createDerivedPages('nonexistent', validSplit)).rejects.toThrow(
      'Source not found: nonexistent',
    );
  });

  it('executes UPDATE and two INSERTs within a transaction when source exists', async () => {
    let callCount = 0;
    const mockTrx = {
      execute: vi.fn().mockImplementation(() => {
        callCount++;
        // First call: SELECT source — return a row
        if (callCount === 1) return Promise.resolve({ rows: [mockSource] });
        // Subsequent calls: UPDATE + 2x INSERT
        return Promise.resolve({ rows: [] });
      }),
    };

    (database.transaction as any).mockReturnValue({
      execute: vi.fn((callback: any) => callback(mockTrx)),
    });

    await createDerivedPages('src-1', validSplit);

    // SELECT + UPDATE + INSERT left + INSERT right = 4 execute calls
    expect(mockTrx.execute).toHaveBeenCalledTimes(4);
  });

  it('rolls back on INSERT failure (transaction throws)', async () => {
    let callCount = 0;
    const mockTrx = {
      execute: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return Promise.resolve({ rows: [mockSource] });
        if (callCount === 2) return Promise.resolve({ rows: [] }); // UPDATE ok
        throw new Error('UNIQUE constraint failed'); // INSERT fails
      }),
    };

    (database.transaction as any).mockReturnValue({
      execute: vi.fn((callback: any) => callback(mockTrx)),
    });

    await expect(createDerivedPages('src-1', validSplit)).rejects.toThrow(
      'UNIQUE constraint failed',
    );
  });
});
