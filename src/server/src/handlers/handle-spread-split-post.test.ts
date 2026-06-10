import type { Context } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createDerivedPages } from '../database/create-derived-pages.js';
import { findImageSource } from '../database/find-image-source.js';

import handleSpreadSplitPost from './handle-spread-split-post.js';

vi.mock('../database/find-image-source.js', () => ({
  findImageSource: vi.fn(),
}));

vi.mock('../database/create-derived-pages.js', () => ({
  createDerivedPages: vi.fn(),
}));

const validBody = {
  sourceId: 'src-456',
  cropX: 0.5,
  leftPageId: 'left-1',
  rightPageId: 'right-1',
  leftPageSequence: 1,
  rightPageSequence: 2,
};

describe('handleSpreadSplitPost', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockContext = {
      req: {
        param: vi.fn((key) => {
          if (key === 'projectId') return 'proj-123';
          if (key === 'sourceId') return 'src-456';
          return undefined;
        }),
        json: vi.fn().mockResolvedValue(validBody),
      },
      json: vi.fn((data, status) => ({ _data: data, status })),
    };
  });

  it('returns 400 if projectId or sourceId is missing', async () => {
    mockContext.req.param.mockImplementation((key: string) => {
      if (key === 'projectId') return '';
      return 'src-456';
    });

    const response = (await handleSpreadSplitPost(
      mockContext as Context,
    )) as any;

    expect(response.status).toBe(400);
    expect(response._data).toEqual({ error: 'Missing projectId or sourceId' });
  });

  it('returns 400 on invalid body (cropX out of range)', async () => {
    mockContext.req.json.mockResolvedValue({ ...validBody, cropX: 0.05 });

    const response = (await handleSpreadSplitPost(
      mockContext as Context,
    )) as any;

    expect(response.status).toBe(400);
    expect(response._data.error).toContain('Invalid fields');
  });

  it('returns 404 if source is not found', async () => {
    vi.mocked(findImageSource).mockResolvedValue(undefined);

    const response = (await handleSpreadSplitPost(
      mockContext as Context,
    )) as any;

    expect(response.status).toBe(404);
    expect(response._data).toEqual({ error: 'Source not found' });
  });

  it('returns 409 if source is already split', async () => {
    vi.mocked(findImageSource).mockResolvedValue({
      id: 'src-456',
      project_id: 'proj-123',
      storage_key: 'projects/proj-123/sources/src-456.jpg',
      width: 800,
      height: 600,
      blurhash: 'LKO2?U%2Tw=w',
      page_count: 2,
      created_at: 1_700_000_000,
    });

    const response = (await handleSpreadSplitPost(
      mockContext as Context,
    )) as any;

    expect(response.status).toBe(409);
    expect(response._data).toEqual({ error: 'Source is already split' });
  });

  it('returns 200 with page IDs on happy path', async () => {
    vi.mocked(findImageSource).mockResolvedValue({
      id: 'src-456',
      project_id: 'proj-123',
      storage_key: 'projects/proj-123/sources/src-456.jpg',
      width: 800,
      height: 600,
      blurhash: 'LKO2?U%2Tw=w',
      page_count: 1,
      created_at: 1_700_000_000,
    });
    vi.mocked(createDerivedPages).mockResolvedValue(undefined);

    const response = (await handleSpreadSplitPost(
      mockContext as Context,
    )) as any;

    expect(response.status).toBeUndefined();
    expect(response._data).toEqual({
      success: true,
      sourceId: 'src-456',
      leftPageId: 'left-1',
      rightPageId: 'right-1',
    });

    expect(createDerivedPages).toHaveBeenCalledWith('src-456', validBody);
  });

  it('returns 500 if createDerivedPages throws', async () => {
    vi.mocked(findImageSource).mockResolvedValue({
      id: 'src-456',
      project_id: 'proj-123',
      storage_key: 'projects/proj-123/sources/src-456.jpg',
      width: 800,
      height: 600,
      blurhash: 'LKO2?U%2Tw=w',
      page_count: 1,
      created_at: 1_700_000_000,
    });
    vi.mocked(createDerivedPages).mockRejectedValue(new Error('DB error'));

    const response = (await handleSpreadSplitPost(
      mockContext as Context,
    )) as any;

    expect(response.status).toBe(500);
    expect(response._data).toEqual({ error: 'Failed to split spread' });
  });
});
