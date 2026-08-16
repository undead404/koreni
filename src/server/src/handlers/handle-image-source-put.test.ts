import type { Context } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createImageSource } from '../database/create-image-source.js';
import { createProjectImage } from '../database/create-project.js';
import { getJpegDimensions } from '../helpers/get-jpeg-dimensions.js';
import { uploadProjectImageToR2 } from '../services/r2.js';

import handleImageSourcePut from './handle-image-source-put.js';

vi.mock('../database/create-image-source.js', () => ({
  createImageSource: vi.fn(),
}));

vi.mock('../database/create-project.js', () => ({
  createProjectImage: vi.fn(),
}));

vi.mock('../helpers/get-jpeg-dimensions.js', () => ({
  getJpegDimensions: vi.fn(),
}));

vi.mock('../services/r2.js', () => ({
  uploadProjectImageToR2: vi.fn(),
}));

describe('handleImageSourcePut', () => {
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
        parseBody: vi.fn(),
      },
      json: vi.fn((data, status) => ({ _data: data, status })),
    };
  });

  it('returns 400 if projectId or sourceId is missing', async () => {
    mockContext.req.param.mockImplementation((key: string) => {
      if (key === 'projectId') return '';
      return 'src-456';
    });

    const response = (await handleImageSourcePut(
      mockContext as Context,
    )) as any;

    expect(response.status).toBe(400);
    expect(response._data).toEqual({ error: 'Missing projectId or sourceId' });
  });

  it('returns 400 on missing required fields', async () => {
    mockContext.req.parseBody.mockResolvedValue({ blurhash: 'abc' });

    const response = (await handleImageSourcePut(
      mockContext as Context,
    )) as any;

    expect(response.status).toBe(400);
    expect(response._data.error).toContain('Invalid fields');
  });

  it('returns 400 if file is missing', async () => {
    mockContext.req.parseBody.mockResolvedValue({
      pageSequence: '1',
      blurhash: 'LKO2?U%2Tw=w',
      pageId: 'page-789',
    });

    const response = (await handleImageSourcePut(
      mockContext as Context,
    )) as any;

    expect(response.status).toBe(400);
    expect(response._data).toEqual({ error: 'Missing or invalid file' });
  });

  it('returns 400 if file is not JPEG', async () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'test.png', {
      type: 'image/png',
    });

    mockContext.req.parseBody.mockResolvedValue({
      pageSequence: '1',
      blurhash: 'LKO2?U%2Tw=w',
      pageId: 'page-789',
      file,
    });

    const response = (await handleImageSourcePut(
      mockContext as Context,
    )) as any;

    expect(response.status).toBe(400);
    expect(response._data).toEqual({ error: 'Only JPEG images are allowed' });
  });

  it('returns 400 if JPEG dimension extraction fails', async () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'test.jpg', {
      type: 'image/jpeg',
    });

    mockContext.req.parseBody.mockResolvedValue({
      pageSequence: '1',
      blurhash: 'LKO2?U%2Tw=w',
      pageId: 'page-789',
      file,
    });

    vi.mocked(getJpegDimensions).mockImplementation(() => {
      throw new Error('Corrupt JPEG');
    });

    const response = (await handleImageSourcePut(
      mockContext as Context,
    )) as any;

    expect(response.status).toBe(400);
    expect(response._data).toEqual({
      error: 'Invalid JPEG file: Corrupt JPEG',
    });
  });

  it('returns 409 if source already exists', async () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'test.jpg', {
      type: 'image/jpeg',
    });

    mockContext.req.parseBody.mockResolvedValue({
      pageSequence: '1',
      blurhash: 'LKO2?U%2Tw=w',
      pageId: 'page-789',
      file,
    });

    vi.mocked(getJpegDimensions).mockReturnValue({ width: 800, height: 600 });
    vi.mocked(uploadProjectImageToR2).mockResolvedValue({
      key: 'projects/proj-123/sources/src-456.jpg',
      url: 'https://r2.example.com/projects/proj-123/sources/src-456.jpg',
    });
    vi.mocked(createImageSource).mockRejectedValue(
      new Error('Source ID already exists'),
    );

    const response = (await handleImageSourcePut(
      mockContext as Context,
    )) as any;

    expect(response.status).toBe(409);
    expect(response._data).toEqual({ error: 'Source already exists' });
  });

  it('returns 200 with sourceId, pageId, and url on happy path', async () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'test.jpg', {
      type: 'image/jpeg',
    });

    mockContext.req.parseBody.mockResolvedValue({
      pageSequence: '1',
      blurhash: 'LKO2?U%2Tw=w',
      pageId: 'page-789',
      file,
    });

    vi.mocked(getJpegDimensions).mockReturnValue({ width: 800, height: 600 });
    vi.mocked(uploadProjectImageToR2).mockResolvedValue({
      key: 'projects/proj-123/sources/src-456.jpg',
      url: 'https://r2.example.com/projects/proj-123/sources/src-456.jpg',
    });
    vi.mocked(createImageSource).mockResolvedValue(undefined);
    vi.mocked(createProjectImage).mockResolvedValue(undefined);

    const response = (await handleImageSourcePut(
      mockContext as Context,
    )) as any;

    expect(response.status).toBeUndefined();
    expect(response._data).toEqual({
      success: true,
      sourceId: 'src-456',
      pageId: 'page-789',
      url: 'https://r2.example.com/projects/proj-123/sources/src-456.jpg',
    });

    expect(createImageSource).toHaveBeenCalledWith({
      id: 'src-456',
      projectId: 'proj-123',
      storageKey: 'projects/proj-123/sources/src-456.jpg',
      width: 800,
      height: 600,
      blurhash: 'LKO2?U%2Tw=w',
    });

    expect(createProjectImage).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'page-789',
        projectId: 'proj-123',
        sourceId: 'src-456',
        cropX: null,
        side: null,
      }),
    );
  });

  it('returns 500 if R2 upload throws', async () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'test.jpg', {
      type: 'image/jpeg',
    });

    mockContext.req.parseBody.mockResolvedValue({
      pageSequence: '1',
      blurhash: 'LKO2?U%2Tw=w',
      pageId: 'page-789',
      file,
    });

    vi.mocked(getJpegDimensions).mockReturnValue({ width: 800, height: 600 });
    vi.mocked(uploadProjectImageToR2).mockRejectedValue(new Error('R2 Down'));

    const response = (await handleImageSourcePut(
      mockContext as Context,
    )) as any;

    expect(response.status).toBe(500);
    expect(response._data).toEqual({ error: 'Failed to upload image source' });
  });
});
