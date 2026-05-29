import type { Context } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getProjectImages } from '../database/get-project-images.js';

import handleProjectImagesList from './handle-project-images-list.js';

vi.mock('../database/get-project-images.js', () => ({
  getProjectImages: vi.fn(),
}));

vi.mock('../services/r2.js', () => ({
  getPublicUrl: vi.fn((key) => `https://mock-r2.com/${key}`),
}));

describe('handleProjectImagesList', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockContext = {
      req: {
        param: vi.fn((key) => {
          if (key === 'projectId') return 'proj-123';
          return undefined;
        }),
      },
      json: vi.fn((data, status) => ({ _data: data, status })),
    };
  });

  it('should return 400 if projectId is missing', async () => {
    mockContext.req.param.mockImplementation((key: string) => {
      if (key === 'projectId') return '';
      return undefined;
    });

    const response = (await handleProjectImagesList(
      mockContext as Context,
    )) as any;

    expect(response.status).toBe(400);
    expect(response._data).toEqual({ error: 'Missing projectId' });
  });

  it('should return 200 and the list of images on Happy Path', async () => {
    const mockImages = [
      {
        id: 'img-1',
        projectId: 'proj-123',
        storageKey: 'uploads/proj-123/img-1.jpg',
        pageSequence: 1,
        pageName: 'Page 1',
        height: 600,
        width: 800,
        createdAt: 123_456_789,
        blurhash: 'U1234567890',
      },
      {
        id: 'img-2',
        projectId: 'proj-123',
        storageKey: 'uploads/proj-123/img-2.jpg',
        pageSequence: 2,
        pageName: 'Page 2',
        height: 600,
        width: 800,
        createdAt: 123_456_790,
        blurhash: 'U1234567891',
      },
    ];

    vi.mocked(getProjectImages).mockResolvedValue(mockImages);

    const response = (await handleProjectImagesList(
      mockContext as Context,
    )) as any;

    expect(response.status).toBeUndefined();
    expect(response._data).toEqual({
      success: true,
      images: mockImages.map((image) => ({
        ...image,
        url: `https://mock-r2.com/${image.storageKey}`,
      })),
    });

    expect(getProjectImages).toHaveBeenCalledWith('proj-123');
  });

  it('should return 200 and an empty list if no images exist', async () => {
    vi.mocked(getProjectImages).mockResolvedValue([]);

    const response = (await handleProjectImagesList(
      mockContext as Context,
    )) as any;

    expect(response.status).toBeUndefined();
    expect(response._data).toEqual({
      success: true,
      images: [],
    });

    expect(getProjectImages).toHaveBeenCalledWith('proj-123');
  });

  it('should return 500 if DB lookup fails', async () => {
    vi.mocked(getProjectImages).mockRejectedValue(new Error('DB read failure'));

    const response = (await handleProjectImagesList(
      mockContext as Context,
    )) as any;

    expect(response.status).toBe(500);
    expect(response._data).toEqual({ error: 'Failed to list project images' });
  });
});
