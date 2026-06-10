import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./client.js', () => ({
  default: {
    transaction: vi.fn(),
  },
}));

import database from './client.js';
import { revertSplit } from './revert-split.js';

describe('revertSplit', () => {
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

    await expect(revertSplit('nonexistent', 'proj-1')).rejects.toThrow(
      'Source not found: nonexistent',
    );
  });

  it('executes SELECT, deactivation UPDATE, re-activation UPDATE, and source UPDATE when source exists', async () => {
    const mockSelectQuery = {
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      executeTakeFirst: vi.fn().mockResolvedValue({ id: 'src-1' }),
    };

    const mockDeactivateQuery = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue({ rows: [] }),
    };

    const mockReactivateQuery = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue({ rows: [] }),
    };

    const mockUpdateSourceQuery = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue({ rows: [] }),
    };

    let updateCallCount = 0;
    const mockTrx = {
      selectFrom: vi.fn().mockReturnValue(mockSelectQuery),
      updateTable: vi.fn().mockImplementation((table: string) => {
        if (table === 'project_image_sources') {
          return mockUpdateSourceQuery;
        }
        // For project_images, alternate between deactivate and reactivate
        updateCallCount++;
        if (updateCallCount === 1) {
          return mockDeactivateQuery;
        }
        return mockReactivateQuery;
      }),
    };

    (database.transaction as any).mockReturnValue({
      execute: vi.fn((callback: any) => callback(mockTrx)),
    });

    await revertSplit('src-1', 'proj-1');

    // Verify all operations were called
    expect(mockTrx.selectFrom).toHaveBeenCalledWith('project_image_sources');
    expect(mockTrx.updateTable).toHaveBeenCalledWith('project_images');
    expect(mockTrx.updateTable).toHaveBeenCalledWith('project_image_sources');
    expect(mockDeactivateQuery.execute).toHaveBeenCalled();
    expect(mockReactivateQuery.execute).toHaveBeenCalled();
  });

  it('deactivates only derived pages (side IS NOT NULL) and re-activates the original row', async () => {
    const mockSelectQuery = {
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      executeTakeFirst: vi.fn().mockResolvedValue({ id: 'src-1' }),
    };

    const mockDeactivateQuery = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue({ rows: [] }),
    };

    const mockReactivateQuery = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue({ rows: [] }),
    };

    const mockUpdateSourceQuery = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue({ rows: [] }),
    };

    let updateCallCount = 0;
    const mockTrx = {
      selectFrom: vi.fn().mockReturnValue(mockSelectQuery),
      updateTable: vi.fn().mockImplementation((table: string) => {
        if (table === 'project_image_sources') {
          return mockUpdateSourceQuery;
        }
        updateCallCount++;
        if (updateCallCount === 1) {
          return mockDeactivateQuery;
        }
        return mockReactivateQuery;
      }),
    };

    (database.transaction as any).mockReturnValue({
      execute: vi.fn((callback: any) => callback(mockTrx)),
    });

    await revertSplit('src-1', 'proj-1');

    // Verify deactivation targets side IS NOT NULL
    expect(mockDeactivateQuery.set).toHaveBeenCalledWith({ is_active: 0 });
    expect(mockDeactivateQuery.where).toHaveBeenCalledWith(
      'source_id',
      '=',
      'src-1',
    );
    expect(mockDeactivateQuery.where).toHaveBeenCalledWith(
      'side',
      'is not',
      null,
    );

    // Verify re-activation targets side IS NULL
    expect(mockReactivateQuery.set).toHaveBeenCalledWith({ is_active: 1 });
    expect(mockReactivateQuery.where).toHaveBeenCalledWith(
      'source_id',
      '=',
      'src-1',
    );
    expect(mockReactivateQuery.where).toHaveBeenCalledWith('side', 'is', null);
  });
});
