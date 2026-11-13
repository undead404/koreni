import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { checkSubmissionIdAvailability } from './submission-id-availability.js';
const { fetchMock, reportError, environment } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  reportError: vi.fn(),
  environment: { GITHUB_REPO: 'owner/repo', GITHUB_TOKEN: 'secret' },
}));
vi.mock('../environment.js', () => ({ default: environment }));
vi.mock('./bugsnag.js', () => ({ reportError }));
const id = 'DAKO-example';
const branch = { ref: `refs/heads/submission/${id}`, object: { sha: 'sha' } };
const record = { type: 'file', path: `data/records/${id}.yaml` };
beforeEach(() => {
  fetchMock.mockReset();
  reportError.mockReset();
  environment.GITHUB_REPO = 'owner/repo';
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});
describe('submission ID availability', () => {
  it.each([
    [404, 404, true],
    [200, 404, false],
    [404, 200, false],
    [200, 200, false],
    [200, 503, false],
    [503, 200, false],
    [404, 503, null],
    [403, 404, null],
    [401, 404, null],
    [429, 404, null],
    [500, 404, null],
    [302, 404, null],
  ])('branch %s and record %s yields %s', async (a, b, expected) => {
    fetchMock
      .mockResolvedValueOnce(Response.json(branch, { status: a }))
      .mockResolvedValueOnce(Response.json(record, { status: b }));
    expect(await checkSubmissionIdAvailability(id)).toBe(expected);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      `https://api.github.com/repos/owner/repo/git/ref/heads/submission/${id}`,
      expect.objectContaining({
        redirect: 'error',
        signal: expect.any(AbortSignal),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `https://api.github.com/repos/owner/repo/contents/data/records/${id}.yaml?ref=main`,
      expect.objectContaining({ redirect: 'error' }),
    );
    expect(reportError).toHaveBeenCalledTimes(
      [a, b].filter((status) => status !== 200 && status !== 404).length,
    );
  });
  it.each([
    {},
    { ...branch, ref: 'wrong' },
    { ...branch, object: { sha: '' } },
  ])('rejects malformed ref %j', async (body) => {
    fetchMock
      .mockResolvedValueOnce(Response.json(body))
      .mockResolvedValueOnce(new Response(null, { status: 404 }));
    expect(await checkSubmissionIdAvailability(id)).toBeNull();
    expect(reportError).toHaveBeenCalledWith(
      new Error('GitHub submission ID availability check failed'),
    );
  });
  it.each([{}, { ...record, type: 'dir' }, { ...record, path: 'wrong' }])(
    'rejects malformed record %j',
    async (body) => {
      fetchMock
        .mockResolvedValueOnce(new Response(null, { status: 404 }))
        .mockResolvedValueOnce(Response.json(body));
      expect(await checkSubmissionIdAvailability(id)).toBeNull();
    },
  );
  it('sanitizes network errors and invalid JSON', async () => {
    fetchMock
      .mockRejectedValueOnce(new Error('secret'))
      .mockResolvedValueOnce(new Response('not json'));
    expect(await checkSubmissionIdAvailability(id)).toBeNull();
    expect(reportError.mock.calls).toStrictEqual([
      [new Error('GitHub submission ID availability check failed')],
      [new Error('GitHub submission ID availability check failed')],
    ]);
  });
  it('cancels both reads with a shared deadline', async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const timeout = vi
      .spyOn(AbortSignal, 'timeout')
      .mockImplementation((ms) => {
        setTimeout(() => {
          controller.abort();
        }, ms);
        return controller.signal;
      });
    fetchMock.mockImplementation(
      (_url: string, options: RequestInit) =>
        new Promise((_resolve, reject) => {
          options.signal?.addEventListener('abort', () => {
            reject(new Error('timeout'));
          });
        }),
    );
    const pending = checkSubmissionIdAvailability(id);
    await vi.advanceTimersByTimeAsync(5000);
    expect(await pending).toBeNull();
    expect(timeout).toHaveBeenCalledExactlyOnceWith(5000);
    expect(reportError).toHaveBeenCalledTimes(2);
  });
  it.each(['invalid', 'owner/repo/extra', 'owner/'])(
    'rejects invalid repository %s',
    async (repo) => {
      environment.GITHUB_REPO = repo;
      expect(await checkSubmissionIdAvailability(id)).toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );
});
