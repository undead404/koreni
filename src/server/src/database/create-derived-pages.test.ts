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
    const mockSelectQuery = {
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      executeTakeFirst: vi.fn().mockResolvedValue(null),
    };

    const mockTrx = {
      selectFrom: vi.fn().mockReturnValue(mockSelectQuery),
    };

    (database.transaction as any).mockReturnValue({
      execute: vi.fn((callback: any) => callback(mockTrx)),
    });

    await expect(createDerivedPages('nonexistent', validSplit)).rejects.toThrow(
      'Source not found: nonexistent',
    );
  });

  it('executes UPDATE, two INSERTs, and deactivation UPDATE within a transaction when source exists', async () => {
    const mockSelectQuery = {
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      executeTakeFirst: vi.fn().mockResolvedValue(mockSource),
    };

    const mockUpdateSourceQuery = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue({ rows: [] }),
    };

    const mockInsertQuery = {
      values: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue({ rows: [] }),
    };

    const mockDeactivateQuery = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue({ rows: [] }),
    };

    const mockTrx = {
      selectFrom: vi.fn().mockReturnValue(mockSelectQuery),
      updateTable: vi.fn().mockImplementation((table: string) => {
        if (table === 'project_image_sources') {
          return mockUpdateSourceQuery;
        }
        return mockDeactivateQuery;
      }),
      insertInto: vi.fn().mockReturnValue(mockInsertQuery),
    };

    (database.transaction as any).mockReturnValue({
      execute: vi.fn((callback: any) => callback(mockTrx)),
    });

    await createDerivedPages('src-1', validSplit);

    // Verify all operations were called
    expect(mockTrx.selectFrom).toHaveBeenCalledWith('project_image_sources');
    expect(mockTrx.updateTable).toHaveBeenCalledWith('project_image_sources');
    expect(mockTrx.insertInto).toHaveBeenCalledWith('project_images');
    expect(mockDeactivateQuery.execute).toHaveBeenCalled();
  });

  it('rolls back on INSERT failure (transaction throws)', async () => {
    const mockSelectQuery = {
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      executeTakeFirst: vi.fn().mockResolvedValue(mockSource),
    };

    const mockUpdateSourceQuery = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue({ rows: [] }),
    };

    const mockInsertLeftQuery = {
      values: vi.fn().mockReturnThis(),
      execute: vi.fn().mockRejectedValue(new Error('UNIQUE constraint failed')),
    };

    const mockTrx = {
      selectFrom: vi.fn().mockReturnValue(mockSelectQuery),
      updateTable: vi.fn().mockReturnValue(mockUpdateSourceQuery),
      insertInto: vi.fn().mockReturnValue(mockInsertLeftQuery),
    };

    (database.transaction as any).mockReturnValue({
      execute: vi.fn((callback: any) => callback(mockTrx)),
    });

    await expect(createDerivedPages('src-1', validSplit)).rejects.toThrow(
      'UNIQUE constraint failed',
    );
  });

  it('deactivates the original unsplit image row after inserting derived pages', async () => {
    const mockSelectQuery = {
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      executeTakeFirst: vi.fn().mockResolvedValue(mockSource),
    };

    const mockUpdateSourceQuery = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue({ rows: [] }),
    };

    const mockInsertQuery = {
      values: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue({ rows: [] }),
    };

    const mockDeactivateQuery = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue({ rows: [] }),
    };

    const mockTrx = {
      selectFrom: vi.fn().mockReturnValue(mockSelectQuery),
      updateTable: vi.fn().mockImplementation((table: string) => {
        if (table === 'project_image_sources') {
          return mockUpdateSourceQuery;
        }
        return mockDeactivateQuery;
      }),
      insertInto: vi.fn().mockReturnValue(mockInsertQuery),
    };

    (database.transaction as any).mockReturnValue({
      execute: vi.fn((callback: any) => callback(mockTrx)),
    });

    await createDerivedPages('src-1', validSplit);

    // Verify deactivation was called with correct parameters
    expect(mockDeactivateQuery.set).toHaveBeenCalledWith({ is_active: 0 });
    expect(mockDeactivateQuery.where).toHaveBeenCalledWith(
      'source_id',
      '=',
      'src-1',
    );
    expect(mockDeactivateQuery.where).toHaveBeenCalledWith('side', 'is', null);
  });
});
