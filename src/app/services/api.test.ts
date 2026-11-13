import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { initBugsnag } from '@/app/services/bugsnag';

import requestApi, { ApiRequestError } from './api';

const { notify } = vi.hoisted(() => ({ notify: vi.fn() }));

vi.mock('@/app/environment', () => ({
  default: { NEXT_PUBLIC_API_SITE: 'https://api.example.com' },
}));
vi.mock('@/app/services/bugsnag', () => ({
  initBugsnag: vi.fn(() => ({ notify })),
}));

describe('requestApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the original response and includes credentials', async () => {
    const response = Response.json({ user: { id: '1' } });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(response);
    const parameters = { method: 'POST', body: 'payload' };

    await expect(requestApi('/api/auth/me', parameters)).resolves.toBe(response);

    expect(fetchSpy).toHaveBeenCalledWith(
      new URL('https://api.example.com/api/auth/me'),
      { credentials: 'include', ...parameters },
    );
    expect(initBugsnag).not.toHaveBeenCalled();
  });

  it.each(['/api/auth/me', '/api/auth/email-visibility', '/api/karma/status'])(
    'rejects 401 from %s without reporting it',
    async (path) => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(null, { status: 401 }),
      );

      const result = requestApi(path);

      await expect(result).rejects.toBeInstanceOf(ApiRequestError);
      await expect(result).rejects.toMatchObject({
        name: 'ApiRequestError',
        status: 401,
        message: 'Request failed with HTTP 401',
      });
      expect(initBugsnag).not.toHaveBeenCalled();
      expect(notify).not.toHaveBeenCalled();
    },
  );

  it.each([400, 403, 404, 409, 429, 500, 503])(
    'reports HTTP %s once and rethrows the same error',
    async (status) => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(null, { status }),
      );

      let error: unknown;
      try {
        await requestApi('/api/auth/me');
      } catch (error_) {
        error = error_;
      }

      expect(error).toBeInstanceOf(ApiRequestError);
      expect(error).toMatchObject({ status });
      expect(notify).toHaveBeenCalledExactlyOnceWith(error);
    },
  );

  it('reports network failures and preserves the original error', async () => {
    const error = new TypeError('Failed to fetch');
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(error);

    await expect(requestApi('/api/auth/me')).rejects.toBe(error);

    expect(notify).toHaveBeenCalledExactlyOnceWith(error);
  });
});
