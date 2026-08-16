import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import splitSpread from './split-spread';

vi.mock('./request', () => ({
  default: vi.fn(),
}));

import requestApi from './request';

const validPayload = {
  cropX: 0.5,
  leftPageId: 'left-1',
  rightPageId: 'right-1',
  leftPageSequence: 1,
  rightPageSequence: 2,
};

describe('splitSpread', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls POST on the correct endpoint with JSON body', async () => {
    (requestApi as Mock).mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        success: true,
        sourceId: 'src-1',
        leftPageId: 'left-1',
        rightPageId: 'right-1',
      }),
    });

    const result = await splitSpread('proj-1', 'src-1', validPayload);

    expect(requestApi).toHaveBeenCalledWith(
      '/api/transcribe/projects/proj-1/image-sources/src-1/split',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    expect(result).toStrictEqual({
      success: true,
      sourceId: 'src-1',
      leftPageId: 'left-1',
      rightPageId: 'right-1',
    });
  });

  it('includes sourceId in the request body', async () => {
    (requestApi as Mock).mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        success: true,
        sourceId: 'src-1',
        leftPageId: 'left-1',
        rightPageId: 'right-1',
      }),
    });

    await splitSpread('proj-1', 'src-1', validPayload);

    const callArguments = (requestApi as Mock).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const body = JSON.parse(callArguments[1].body as string) as Record<
      string,
      unknown
    >;
    expect(body.sourceId).toBe('src-1');
    expect(body.cropX).toBe(0.5);
  });

  it('propagates errors from requestApi', async () => {
    (requestApi as Mock).mockRejectedValue(new Error('Network error'));

    await expect(splitSpread('proj-1', 'src-1', validPayload)).rejects.toThrow(
      'Network error',
    );
  });

  it('throws on invalid response shape', async () => {
    (requestApi as Mock).mockResolvedValue({
      json: vi.fn().mockResolvedValue({ unexpected: true }),
    });

    await expect(
      splitSpread('proj-1', 'src-1', validPayload),
    ).rejects.toThrow();
  });
});
