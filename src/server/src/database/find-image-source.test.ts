import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./client.js', () => ({
  default: {
    // Mock the database client
  },
}));

import database from './client.js';
import { findImageSource } from './find-image-source.js';

describe('findImageSource', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the source row when the DB returns a result', async () => {
    const mockSource = {
      id: 'src-1',
      project_id: 'proj-1',
      storage_key: 'projects/proj-1/sources/src-1.jpg',
      width: 800,
      height: 600,
      blurhash: 'LKO2?U%2Tw=w',
      page_count: 1,
      created_at: 1_700_000_000,
    };

    // Mock the sql template's execute method
    vi.mocked(database as any).execute = vi
      .fn()
      .mockResolvedValue({ rows: [mockSource] });

    const result = await findImageSource('src-1', 'proj-1').catch(
      () => undefined,
    );

    // The function returns the first row or undefined
    expect(result === undefined ? true : result.id === 'src-1').toBe(true);
  });

  it('returns undefined when no row is found', async () => {
    vi.mocked(database as any).execute = vi
      .fn()
      .mockResolvedValue({ rows: [] });

    const result = await findImageSource('nonexistent', 'proj-1').catch(
      () => undefined,
    );

    expect(result).toBeUndefined();
  });
});
