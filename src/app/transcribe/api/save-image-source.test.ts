import { beforeEach, describe, expect, it, vi } from 'vitest';

import saveImageSource from './save-image-source';

vi.mock('../helpers/calculate-blurhash', () => ({
  calculateBlurhash: vi.fn().mockResolvedValue('LKO2?U%2Tw=w]~RBVZRi};RPxuwH'),
}));

vi.mock('./request', () => ({
  default: vi.fn(),
}));

import { Mock } from 'vitest';

import requestApi from './request';

describe('saveImageSource', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls PUT on the correct endpoint with FormData', async () => {
    (requestApi as Mock).mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        success: true,
        sourceId: 'src-1',
        pageId: 'page-1',
        url: 'https://cdn.example.com/img.jpg',
      }),
    });

    const file = new File(['data'], 'scan.jpg', { type: 'image/jpeg' });
    const result = await saveImageSource('proj-1', 'src-1', 'page-1', file, 3);

    expect(requestApi).toHaveBeenCalledWith(
      '/api/transcribe/projects/proj-1/image-sources/src-1',
      expect.objectContaining({ method: 'PUT' }),
    );

    expect(result).toStrictEqual({
      success: true,
      sourceId: 'src-1',
      pageId: 'page-1',
      url: 'https://cdn.example.com/img.jpg',
    });
  });

  it('propagates errors from requestApi', async () => {
    (requestApi as Mock).mockRejectedValue(new Error('Network error'));

    const file = new File(['data'], 'scan.jpg', { type: 'image/jpeg' });
    await expect(
      saveImageSource('proj-1', 'src-1', 'page-1', file, 1),
    ).rejects.toThrow('Network error');
  });

  it('throws on invalid response shape', async () => {
    (requestApi as Mock).mockResolvedValue({
      json: vi.fn().mockResolvedValue({ unexpected: true }),
    });

    const file = new File(['data'], 'scan.jpg', { type: 'image/jpeg' });
    await expect(
      saveImageSource('proj-1', 'src-1', 'page-1', file, 1),
    ).rejects.toThrow();
  });
});
