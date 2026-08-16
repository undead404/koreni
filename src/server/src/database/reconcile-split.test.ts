import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./client.js', () => ({
  default: {
    transaction: vi.fn(),
  },
}));

import database from './client.js';
import { reconcileSplit } from './reconcile-split.js';

describe('reconcileSplit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns already_complete when 2 active derived rows exist with matching cropX', async () => {
    const mockSelectQuery = {
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue([
        { id: 'left-1', side: 'left', crop_x: 0.5 },
        { id: 'right-1', side: 'right', crop_x: 0.5 },
      ]),
    };

    const mockTrx = {
      selectFrom: vi.fn().mockReturnValue(mockSelectQuery),
    };

    (database.transaction as any).mockReturnValue({
      execute: vi.fn((callback: any) => callback(mockTrx)),
    });

    const result = await reconcileSplit('src-1', 0.5);

    expect(result).toEqual({
      status: 'already_complete',
      leftPageId: 'left-1',
      rightPageId: 'right-1',
      cropX: 0.5,
    });
    expect(mockTrx.selectFrom).toHaveBeenCalledWith('project_images');
  });

  it('returns already_complete within float tolerance (±0.001)', async () => {
    const mockSelectQuery = {
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue([
        { id: 'left-1', side: 'left', crop_x: 0.5001 },
        { id: 'right-1', side: 'right', crop_x: 0.5001 },
      ]),
    };

    const mockTrx = {
      selectFrom: vi.fn().mockReturnValue(mockSelectQuery),
    };

    (database.transaction as any).mockReturnValue({
      execute: vi.fn((callback: any) => callback(mockTrx)),
    });

    const result = await reconcileSplit('src-1', 0.5);

    expect(result.status).toBe('already_complete');
  });

  it('returns conflict when 2 active derived rows exist with different cropX', async () => {
    const mockSelectQuery = {
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue([
        { id: 'left-1', side: 'left', crop_x: 0.4 },
        { id: 'right-1', side: 'right', crop_x: 0.4 },
      ]),
    };

    const mockTrx = {
      selectFrom: vi.fn().mockReturnValue(mockSelectQuery),
    };

    (database.transaction as any).mockReturnValue({
      execute: vi.fn((callback: any) => callback(mockTrx)),
    });

    const result = await reconcileSplit('src-1', 0.6);

    expect(result).toEqual({
      status: 'conflict',
      existingCropX: 0.4,
      leftPageId: 'left-1',
      rightPageId: 'right-1',
    });
  });

  it('returns repaired and resets state when 0 active derived rows exist', async () => {
    const mockSelectQuery = {
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue([]),
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

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    (database.transaction as any).mockReturnValue({
      execute: vi.fn((callback: any) => callback(mockTrx)),
    });

    const result = await reconcileSplit('src-1', 0.5);

    expect(result).toEqual({ status: 'repaired' });
    expect(mockDeactivateQuery.execute).toHaveBeenCalled();
    expect(mockReactivateQuery.execute).toHaveBeenCalled();
    expect(mockUpdateSourceQuery.execute).toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Repaired broken split'),
      'src-1',
    );

    warnSpy.mockRestore();
  });

  it('returns repaired and deactivates orphan when 1 active derived row exists', async () => {
    const mockSelectQuery = {
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: vi
        .fn()
        .mockResolvedValue([{ id: 'left-1', side: 'left', crop_x: 0.5 }]),
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

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    (database.transaction as any).mockReturnValue({
      execute: vi.fn((callback: any) => callback(mockTrx)),
    });

    const result = await reconcileSplit('src-1', 0.5);

    expect(result).toEqual({ status: 'repaired' });
    expect(mockDeactivateQuery.execute).toHaveBeenCalled();
    expect(mockReactivateQuery.execute).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('handles null crop_x on existing derived row as conflict', async () => {
    const mockSelectQuery = {
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue([
        { id: 'left-1', side: 'left', crop_x: null },
        { id: 'right-1', side: 'right', crop_x: null },
      ]),
    };

    const mockTrx = {
      selectFrom: vi.fn().mockReturnValue(mockSelectQuery),
    };

    (database.transaction as any).mockReturnValue({
      execute: vi.fn((callback: any) => callback(mockTrx)),
    });

    const result = await reconcileSplit('src-1', 0.5);

    expect(result.status).toBe('conflict');
    const existingCropX =
      result.status === 'conflict' ? result.existingCropX : undefined;
    expect(existingCropX).toBe(null);
  });

  it('treats malformed 2-row state (not left+right) as broken and repairs', async () => {
    const mockSelectQuery = {
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue([
        { id: 'left-1', side: 'left', crop_x: 0.5 },
        { id: 'left-2', side: 'left', crop_x: 0.5 }, // Two lefts — malformed
      ]),
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

    const result = await reconcileSplit('src-1', 0.5);

    expect(result).toEqual({ status: 'repaired' });
    expect(mockDeactivateQuery.execute).toHaveBeenCalled();
  });
});
