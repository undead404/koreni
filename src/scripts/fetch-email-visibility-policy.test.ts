import { writeFile } from 'node:fs/promises';

import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { fetchEmailVisibilityPolicy } from './fetch-email-visibility-policy';

const server = setupServer();
const writeFileMock = vi.hoisted(() => vi.fn());

vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actual,
    default: { writeFile: writeFileMock },
    writeFile: writeFileMock,
  };
});

describe('fetchEmailVisibilityPolicy', () => {
  beforeAll(() => {
    server.listen({ onUnhandledFrame: 'error' });
  });
  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_API_SITE', 'https://api.example.test');
    vi.stubEnv('EMAIL_VISIBILITY_SYNC_TOKEN', 'secret-build-token');
    vi.mocked(writeFile).mockResolvedValue(undefined);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    server.resetHandlers();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('requests, validates, normalizes, deduplicates, and writes listed policy', async () => {
    let authorization: string | null = null;
    server.use(
      http.get(
        'https://api.example.test/api/internal/email-visibility-policy',
        ({ request }) => {
          authorization = request.headers.get('authorization');
          return HttpResponse.json({
            suppressed_emails: [' Person@Example.org ', 'person@example.org'],
          });
        },
      ),
    );

    await fetchEmailVisibilityPolicy();

    expect(authorization).toBe('Bearer secret-build-token');
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringMatching(/\.email-visibility-policy\.json$/),
      '{"mode":"listed","suppressed_emails":["person@example.org"]}\n',
      'utf8',
    );
  });

  it.each([
    [
      'HTTP errors',
      () => HttpResponse.json({ error: 'unavailable' }, { status: 503 }),
    ],
    ['connection errors', () => HttpResponse.error()],
    ['invalid JSON', () => HttpResponse.text('{invalid-json')],
    [
      'invalid response schema',
      () => HttpResponse.json({ suppressed_emails: [42] }),
    ],
    [
      'invalid normalized email',
      () => HttpResponse.json({ suppressed_emails: ['not-an-email'] }),
    ],
  ])(
    'writes all-mode policy for %s without logging private values',
    async (_label, respond) => {
      server.use(
        http.get(
          'https://api.example.test/api/internal/email-visibility-policy',
          () => respond(),
        ),
      );
      const consoleError = vi.mocked(console.error);

      await fetchEmailVisibilityPolicy();

      expect(writeFile).toHaveBeenCalledWith(
        expect.stringMatching(/\.email-visibility-policy\.json$/),
        '{"mode":"all"}\n',
        'utf8',
      );
      const loggedText = JSON.stringify(consoleError.mock.calls);
      expect(loggedText).not.toContain('person@example.org');
      expect(loggedText).not.toContain('secret-build-token');
    },
  );

  it('writes all-mode policy when configuration is absent', async () => {
    vi.stubEnv('EMAIL_VISIBILITY_SYNC_TOKEN', '');

    await fetchEmailVisibilityPolicy();

    expect(writeFile).toHaveBeenCalledWith(
      expect.stringMatching(/\.email-visibility-policy\.json$/),
      '{"mode":"all"}\n',
      'utf8',
    );
  });

  it('writes all-mode policy when the bounded request times out', async () => {
    vi.spyOn(AbortSignal, 'timeout').mockReturnValue(AbortSignal.abort());

    await fetchEmailVisibilityPolicy();

    expect(writeFile).toHaveBeenCalledWith(
      expect.stringMatching(/\.email-visibility-policy\.json$/),
      '{"mode":"all"}\n',
      'utf8',
    );
  });

  it('propagates manifest write failures so a stale manifest cannot be consumed', async () => {
    vi.mocked(writeFile).mockRejectedValueOnce(new Error('disk unavailable'));

    await expect(fetchEmailVisibilityPolicy()).rejects.toThrow(
      'disk unavailable',
    );
  });
});
