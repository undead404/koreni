import type { Context } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { findImageSource } from '../database/find-image-source.js';
import { revertSplit } from '../database/revert-split.js';

import handleSpreadRevertDelete from './handle-spread-revert-delete.js';

vi.mock('../database/find-image-source.js', () => ({
  findImageSource: vi.fn(),
}));

vi.mock('../database/revert-split.js', () => ({
  revertSplit: vi.fn(),
}));

const mockSource = {
  id: 'src-456',
  project_id: 'proj-123',
  storage_key: 'projects/proj-123/sources/src-456.jpg',
  width: 800,
  height: 600,
  blurhash: 'LKO2?U%2Tw=w',
  page_count: 2,
  created_at: 1_700_000_000,
};

describe('handleSpreadRevertDelete', () => {
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
      },
      json: vi.fn((data, status) => ({ _data: data, status })),
    };
  });

  it('returns 400 if projectId or sourceId is missing', async () => {
    mockContext.req.param.mockImplementation((key: string) => {
      if (key === 'projectId') return '';
      return 'src-456';
    });

    const response = (await handleSpreadRevertDelete(
      mockContext as Context,
    )) as any;

    expect(response.status).toBe(400);
    expect(response._data).toEqual({ error: 'Missing projectId or sourceId' });
  });

  it('returns 404 if source is not found', async () => {
    vi.mocked(findImageSource).mockResolvedValue(undefined);

    const response = (await handleSpreadRevertDelete(
      mockContext as Context,
    )) as any;

    expect(response.status).toBe(404);
    expect(response._data).toEqual({ error: 'Source not found' });
  });

  it('returns 409 if source is not currently split', async () => {
    vi.mocked(findImageSource).mockResolvedValue({
      ...mockSource,
      page_count: 1,
    });

    const response = (await handleSpreadRevertDelete(
      mockContext as Context,
    )) as any;

    expect(response.status).toBe(409);
    expect(response._data).toEqual({ error: 'Source is not currently split' });
  });

  it('returns 200 on happy path', async () => {
    vi.mocked(findImageSource).mockResolvedValue(mockSource);
    vi.mocked(revertSplit).mockResolvedValue(undefined);

    const response = (await handleSpreadRevertDelete(
      mockContext as Context,
    )) as any;

    expect(response.status).toBeUndefined();
    expect(response._data).toEqual({ success: true });

    expect(revertSplit).toHaveBeenCalledWith('src-456', 'proj-123');
  });

  it('returns 500 if revertSplit throws', async () => {
    vi.mocked(findImageSource).mockResolvedValue(mockSource);
    vi.mocked(revertSplit).mockRejectedValue(new Error('DB error'));

    const response = (await handleSpreadRevertDelete(
      mockContext as Context,
    )) as any;

    expect(response.status).toBe(500);
    expect(response._data).toEqual({ error: 'Failed to revert split' });
  });
});
