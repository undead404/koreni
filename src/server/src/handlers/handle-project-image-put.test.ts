import type { Context } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createProjectImage } from '../database/create-project.js';
import { getJpegDimensions } from '../helpers/get-jpeg-dimensions.js';
import { uploadProjectImageToR2 } from '../services/r2.js';

import handleProjectImagePut from './handle-project-image-put.js';

vi.mock('../database/create-project.js', () => ({
  createProjectImage: vi.fn(),
}));

vi.mock('../helpers/get-jpeg-dimensions.js', () => ({
  getJpegDimensions: vi.fn(),
}));

vi.mock('../services/r2.js', () => ({
  uploadProjectImageToR2: vi.fn(),
  deleteImageFromR2: vi.fn(),
}));

describe('handleProjectImagePut', () => {
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
        parseBody: vi.fn(),
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

    const response = (await handleProjectImagePut(
      mockContext as Context,
    )) as any;

    expect(response.status).toBe(400);
    expect(response._data).toEqual({ error: 'Missing projectId or imageId' });
  });

  it('should return 200 and create record on successful upload (Happy Path)', async () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'test.jpg', {
      type: 'image/jpeg',
    });

    mockContext.req.parseBody.mockResolvedValue({
      pageSequence: '1',
      pageName: 'Page 1',
      blurhash: 'U1234567890',
      file,
    });

    vi.mocked(getJpegDimensions).mockReturnValue({ width: 800, height: 600 });
    vi.mocked(uploadProjectImageToR2).mockResolvedValue({
      key: 'uploads/proj-123/img-456.jpg',
      url: 'https://r2.example.com/uploads/proj-123/img-456.jpg',
    });

    const response = (await handleProjectImagePut(
      mockContext as Context,
    )) as any;

    expect(response.status).toBeUndefined();
    expect(response._data).toEqual({
      success: true,
      key: 'uploads/proj-123/img-456.jpg',
      url: 'https://r2.example.com/uploads/proj-123/img-456.jpg',
    });

    expect(uploadProjectImageToR2).toHaveBeenCalledWith(
      'proj-123',
      'img-456',
      expect.any(Buffer),
      'image/jpeg',
    );

    expect(createProjectImage).toHaveBeenCalledWith({
      id: 'img-456',
      projectId: 'proj-123',
      storageKey: 'uploads/proj-123/img-456.jpg',
      pageSequence: 1,
      pageName: 'Page 1',
      height: 600,
      width: 800,
      blurhash: 'U1234567890',
    });
  });

  it('should return 400 on validation failure (missing fields)', async () => {
    mockContext.req.parseBody.mockResolvedValue({
      blurhash: 'U1234567890',
    });

    const response = (await handleProjectImagePut(
      mockContext as Context,
    )) as any;

    expect(response.status).toBe(400);
    expect(response._data.error).toContain('Invalid fields');
  });

  it('should return 400 if file is missing or invalid', async () => {
    mockContext.req.parseBody.mockResolvedValue({
      pageSequence: '1',
      blurhash: 'U1234567890',
      file: 'not-a-file-object',
    });

    const response = (await handleProjectImagePut(
      mockContext as Context,
    )) as any;

    expect(response.status).toBe(400);
    expect(response._data).toEqual({ error: 'Missing or invalid file' });
  });

  it('should return 400 if file is not a JPEG', async () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'test.png', {
      type: 'image/png',
    });

    mockContext.req.parseBody.mockResolvedValue({
      pageSequence: '1',
      blurhash: 'U1234567890',
      file,
    });

    const response = (await handleProjectImagePut(
      mockContext as Context,
    )) as any;

    expect(response.status).toBe(400);
    expect(response._data).toEqual({ error: 'Only JPEG images are allowed' });
  });

  it('should return 400 if JPEG dimensions extraction throws', async () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'test.jpg', {
      type: 'image/jpeg',
    });

    mockContext.req.parseBody.mockResolvedValue({
      pageSequence: '1',
      blurhash: 'U1234567890',
      file,
    });

    vi.mocked(getJpegDimensions).mockImplementation(() => {
      throw new Error('Corrupt JPEG');
    });

    const response = (await handleProjectImagePut(
      mockContext as Context,
    )) as any;

    expect(response.status).toBe(400);
    expect(response._data).toEqual({
      error: 'Invalid JPEG file: Corrupt JPEG',
    });
  });

  it('should return 500 if upload throws', async () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'test.jpg', {
      type: 'image/jpeg',
    });

    mockContext.req.parseBody.mockResolvedValue({
      pageSequence: '1',
      blurhash: 'U1234567890',
      file,
    });

    vi.mocked(getJpegDimensions).mockReturnValue({ width: 800, height: 600 });
    vi.mocked(uploadProjectImageToR2).mockRejectedValue(new Error('R2 Down'));

    const response = (await handleProjectImagePut(
      mockContext as Context,
    )) as any;

    expect(response.status).toBe(500);
    expect(response._data).toEqual({ error: 'Failed to upload image' });
  });
});
