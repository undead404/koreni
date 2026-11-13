import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { fetchMock, reportError, environment } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  reportError: vi.fn(),
  environment: { GITHUB_REPO: 'owner/repo', GITHUB_TOKEN: 'secret-token' },
}));

vi.mock('../environment.js', () => ({ default: environment }));
vi.mock('./bugsnag.js', () => ({ reportError }));

const reference = {
  ref: 'refs/heads/main',
  object: { type: 'commit', sha: 'commit-sha' },
};

describe('GitHub import readiness', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    reportError.mockReset();
    environment.GITHUB_REPO = 'owner/repo';
    fetchMock.mockResolvedValue(Response.json(reference));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('reads the import base branch with the configured credential and timeout', async () => {
    const timeout = vi.spyOn(AbortSignal, 'timeout');
    const { checkGithubReadiness } = await import('./github-readiness.js');

    expect(await checkGithubReadiness()).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/repos/owner/repo/git/ref/heads/main',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer secret-token',
        }),
        redirect: 'error',
        signal: expect.any(AbortSignal),
      }),
    );
    expect(timeout).toHaveBeenCalledWith(5000);
    expect(reportError).not.toHaveBeenCalled();
  });

  it.each([401, 403, 404, 429, 500])(
    'returns unavailable for HTTP %s without leaking provider data',
    async (status) => {
      fetchMock.mockResolvedValue(
        new Response('secret-token provider detail', { status }),
      );
      const { checkGithubReadiness } = await import('./github-readiness.js');

      expect(await checkGithubReadiness()).toBe(false);
      expect(reportError).toHaveBeenCalledExactlyOnceWith(
        new Error('GitHub import readiness check failed'),
      );
      expect(fetchMock).toHaveBeenCalledOnce();
    },
  );

  it.each([{}, { ...reference, ref: 'refs/heads/other' }])(
    'rejects malformed GitHub data: %j',
    async (body) => {
      fetchMock.mockResolvedValue(Response.json(body));
      const { checkGithubReadiness } = await import('./github-readiness.js');
      expect(await checkGithubReadiness()).toBe(false);
      expect(reportError).toHaveBeenCalledOnce();
    },
  );

  it('handles invalid JSON', async () => {
    fetchMock.mockResolvedValue(new Response('invalid json'));
    const { checkGithubReadiness } = await import('./github-readiness.js');
    expect(await checkGithubReadiness()).toBe(false);
    expect(reportError).toHaveBeenCalledOnce();
  });

  it('handles network failures without exposing the original error', async () => {
    fetchMock.mockRejectedValue(new Error('secret-token'));
    const { checkGithubReadiness } = await import('./github-readiness.js');
    expect(await checkGithubReadiness()).toBe(false);
    expect(reportError).toHaveBeenCalledExactlyOnceWith(
      new Error('GitHub import readiness check failed'),
    );
  });

  it('returns unavailable when the request times out', async () => {
    const controller = new AbortController();
    vi.spyOn(AbortSignal, 'timeout').mockImplementation((delay) => {
      setTimeout(() => {
        controller.abort();
      }, delay);
      return controller.signal;
    });
    fetchMock.mockImplementation(
      (_url, options: RequestInit) =>
        new Promise((_resolve, reject) => {
          options.signal?.addEventListener('abort', () => {
            reject(new Error('timeout'));
          });
        }),
    );
    const { checkGithubReadiness } = await import('./github-readiness.js');
    const pending = checkGithubReadiness();
    await vi.advanceTimersByTimeAsync(5000);
    expect(await pending).toBe(false);
    expect(reportError).toHaveBeenCalledOnce();
  });

  it.each([true, false])(
    'shares concurrent requests and caches readiness=%s for 30 seconds',
    async (ready) => {
      fetchMock.mockImplementation(() =>
        Promise.resolve(
          ready
            ? Response.json(reference)
            : new Response(null, { status: 401 }),
        ),
      );
      const { checkGithubReadiness } = await import('./github-readiness.js');
      expect(
        await Promise.all([checkGithubReadiness(), checkGithubReadiness()]),
      ).toEqual([ready, ready]);
      await vi.advanceTimersByTimeAsync(29_999);
      expect(await checkGithubReadiness()).toBe(ready);
      expect(fetchMock).toHaveBeenCalledOnce();
      await vi.advanceTimersByTimeAsync(1);
      expect(await checkGithubReadiness()).toBe(ready);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    },
  );

  it('rejects malformed repository configuration without a network call', async () => {
    environment.GITHUB_REPO = 'invalid';
    const { checkGithubReadiness } = await import('./github-readiness.js');
    expect(await checkGithubReadiness()).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(reportError).toHaveBeenCalledOnce();
  });
});
