import type { Context } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { deleteProjectImage } from '../database/delete-project-image.js';
import { findProjectImage } from '../database/find-project-image.js';
import { deleteImageFromR2 } from '../services/r2.js';

import handleProjectImageDelete from './handle-project-image-delete.js';

vi.mock('../database/delete-project-image.js', () => ({
  deleteProjectImage: vi.fn(),
}));

vi.mock('../database/find-project-image.js', () => ({
  findProjectImage: vi.fn(),
}));

vi.mock('../services/r2.js', () => ({
  deleteImageFromR2: vi.fn(),
}));

describe('handleProjectImageDelete', () => {
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

    const response = (await handleProjectImageDelete(
      mockContext as Context,
    )) as any;

    expect(response.status).toBe(400);
    expect(response._data).toEqual({ error: 'Missing projectId or imageId' });
  });

  it('should return 200 and delete image from R2 and DB on Happy Path', async () => {
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
      transcription: null,
    });

    const response = (await handleProjectImageDelete(
      mockContext as Context,
    )) as any;

    expect(response.status).toBeUndefined();
    expect(response._data).toEqual({ success: true });

    expect(findProjectImage).toHaveBeenCalledWith('proj-123', 'img-456');
    expect(deleteImageFromR2).toHaveBeenCalledWith(
      'uploads/proj-123/img-456.jpg',
    );
    expect(deleteProjectImage).toHaveBeenCalledWith('proj-123', 'img-456');
  });

  it('should return 404 if image is not found in DB', async () => {
    vi.mocked(findProjectImage).mockResolvedValue(undefined);

    const response = (await handleProjectImageDelete(
      mockContext as Context,
    )) as any;

    expect(response.status).toBe(404);
    expect(response._data).toEqual({ error: 'Image record not found' });

    expect(deleteImageFromR2).not.toHaveBeenCalled();
    expect(deleteProjectImage).not.toHaveBeenCalled();
  });

  it('should return 500 if DB lookup throws', async () => {
    vi.mocked(findProjectImage).mockRejectedValue(
      new Error('DB connection lost'),
    );

    const response = (await handleProjectImageDelete(
      mockContext as Context,
    )) as any;

    expect(response.status).toBe(500);
    expect(response._data).toEqual({ error: 'Failed to delete image' });
  });
});
