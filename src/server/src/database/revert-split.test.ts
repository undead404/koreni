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
    const mockTrx = {
      execute: vi.fn().mockResolvedValue({ rows: [] }),
    };

    (database.transaction as any).mockReturnValue({
      execute: vi.fn((callback: any) => callback(mockTrx)),
    });

    await expect(revertSplit('nonexistent', 'proj-1')).rejects.toThrow(
      'Source not found: nonexistent',
    );
  });

  it('executes UPDATE on project_images and project_image_sources when source exists', async () => {
    let callCount = 0;
    const mockTrx = {
      execute: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1)
          return Promise.resolve({ rows: [{ id: 'src-1' }] });
        return Promise.resolve({ rows: [] });
      }),
    };

    (database.transaction as any).mockReturnValue({
      execute: vi.fn((callback: any) => callback(mockTrx)),
    });

    await revertSplit('src-1', 'proj-1');

    // SELECT + UPDATE project_images + UPDATE project_image_sources = 3 calls
    expect(mockTrx.execute).toHaveBeenCalledTimes(3);
  });
});
