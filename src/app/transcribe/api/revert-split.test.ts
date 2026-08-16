import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import revertSplit from './revert-split';

vi.mock('./request', () => ({
  default: vi.fn(),
}));

import requestApi from './request';

describe('revertSplit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls DELETE on the correct endpoint', async () => {
    (requestApi as Mock).mockResolvedValue({
      json: vi.fn().mockResolvedValue({ success: true }),
    });

    const result = await revertSplit('proj-1', 'src-1');

    expect(requestApi).toHaveBeenCalledWith(
      '/api/transcribe/projects/proj-1/image-sources/src-1/split',
      expect.objectContaining({ method: 'DELETE' }),
    );

    expect(result).toStrictEqual({ success: true });
  });

  it('forwards AbortSignal to requestApi', async () => {
    (requestApi as Mock).mockResolvedValue({
      json: vi.fn().mockResolvedValue({ success: true }),
    });

    const controller = new AbortController();
    await revertSplit('proj-1', 'src-1', controller.signal);

    const callArguments = (requestApi as Mock).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(callArguments[1].signal).toBe(controller.signal);
  });

  it('propagates errors from requestApi', async () => {
    (requestApi as Mock).mockRejectedValue(new Error('Network error'));

    await expect(revertSplit('proj-1', 'src-1')).rejects.toThrow(
      'Network error',
    );
  });

  it('throws on invalid response shape', async () => {
    (requestApi as Mock).mockResolvedValue({
      json: vi.fn().mockResolvedValue({ unexpected: true }),
    });

    await expect(revertSplit('proj-1', 'src-1')).rejects.toThrow();
  });
});
