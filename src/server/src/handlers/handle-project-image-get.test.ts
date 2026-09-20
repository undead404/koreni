import type { Context } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { findProjectImage } from '../database/find-project-image.js';

import handleProjectImageGet from './handle-project-image-get.js';

vi.mock('../database/find-project-image.js', () => ({
  findProjectImage: vi.fn(),
}));

describe('handleProjectImageGet', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockContext = {
      req: {
        param: vi.fn((key) => {
          if (key === 'projectId') return 'proj-123';
          if (key === 'imageId') return 'img-456';
          return undefined;
        }),
      },
      json: vi.fn((data, status) => ({ _data: data, status })),
    };
  });

  it('should return 400 if projectId or imageId is missing', async () => {
    mockContext.req.param.mockImplementation((key: string) => {
      if (key === 'projectId') return '';
      if (key === 'imageId') return 'img-456';
      return undefined;
    });

    const response = (await handleProjectImageGet(
      mockContext as Context,
    )) as any;

    expect(response.status).toBe(400);
    expect(response._data).toEqual({ error: 'Missing projectId or imageId' });
  });

  it('should return 200 and the mapped image on Happy Path', async () => {
    vi.mocked(findProjectImage).mockResolvedValue({
      id: 'img-456',
      project_id: 'proj-123',
      storage_key: 'uploads/proj-123/img-456.jpg',
      page_sequence: 1,
      page_name: 'Page 1',
      height: 600,
      width: 800,
      created_at: 123_456_789,
      blurhash: 'U1234567890',
    });

    const response = (await handleProjectImageGet(
      mockContext as Context,
    )) as any;

    expect(response.status).toBeUndefined();
    expect(response._data).toEqual({
      success: true,
      image: {
        id: 'img-456',
        projectId: 'proj-123',
        storageKey: 'uploads/proj-123/img-456.jpg',
        pageSequence: 1,
        pageName: 'Page 1',
        height: 600,
        width: 800,
        createdAt: 123_456_789,
        blurhash: 'U1234567890',
      },
    });

    expect(findProjectImage).toHaveBeenCalledWith('proj-123', 'img-456');
  });

  it('should return 404 if image is not found', async () => {
    vi.mocked(findProjectImage).mockResolvedValue(undefined);

    const response = (await handleProjectImageGet(
      mockContext as Context,
    )) as any;

    expect(response.status).toBe(404);
    expect(response._data).toEqual({ error: 'Image not found' });
  });

  it('should return 500 if DB query throws', async () => {
    vi.mocked(findProjectImage).mockRejectedValue(new Error('Query timeout'));

    const response = (await handleProjectImageGet(
      mockContext as Context,
    )) as any;

    expect(response.status).toBe(500);
    expect(response._data).toEqual({ error: 'Failed to retrieve image' });
  });
});
