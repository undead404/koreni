import { beforeEach, describe, expect, it, vi } from 'vitest';

import { calculateKarmaContributions } from '../services/karma-calculator.js';

import {
  fetchConsentedEmails,
  type KarmaPushConfig,
  pushKarmaSync,
} from './karma-push.js';

vi.mock('../services/karma-calculator.js', () => ({
  calculateKarmaContributions: vi.fn(),
}));

vi.mock('./environment.js', () => ({
  default: {
    appToken: 'app-token',
    internalToken: 'internal-token',
    koreniServerUrl: 'https://koreni.example.com',
    navigatorBaseUrl: 'https://navigator.example.com',
  },
}));

const config: KarmaPushConfig = {
  appToken: 'app-token',
  internalToken: 'internal-token',
  koreniServerUrl: 'https://koreni.example.com',
  navigatorBaseUrl: 'https://navigator.example.com',
};

function jsonResponse(data: unknown): Response {
  return Response.json(data, {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
}

describe('karma-push', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('preserves primary and contribution emails when loading linked users', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse({
        users: [
          {
            contribution_email: 'contributor@example.com',
            email: 'google@example.com',
            karma_linked_at: '2026-08-22T10:00:00.000Z',
          },
        ],
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchConsentedEmails(config)).resolves.toStrictEqual([
      {
        contributionEmail: 'contributor@example.com',
        email: 'google@example.com',
      },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://koreni.example.com/api/karma/linked-users',
      { headers: { Authorization: 'Bearer internal-token' } },
    );
  });

  it('uses the contribution email for totals and primary email for Navigator login', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          users: [
            {
              contribution_email: 'contributor@example.com',
              email: 'google@example.com',
              karma_linked_at: '2026-08-22T10:00:00.000Z',
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ synced: 1, awarded: 120, unknown: [] }),
      );
    vi.stubGlobal('fetch', fetchMock);
    vi.mocked(calculateKarmaContributions).mockResolvedValueOnce(
      new Map([['contributor@example.com', 120]]),
    );

    await expect(pushKarmaSync(config)).resolves.toStrictEqual({
      synced: 1,
      awarded: 120,
      unknown: [],
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://navigator.example.com/api/karma/ingest',
      {
        body: JSON.stringify({
          accounts: [{ login: 'google@example.com', total: 120 }],
        }),
        headers: {
          Authorization: 'Bearer app-token',
          'Content-Type': 'application/json',
        },
        method: 'POST',
      },
    );
  });

  it('falls back to the primary email for local contribution lookup', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          users: [
            {
              contribution_email: null,
              email: 'google@example.com',
              karma_linked_at: '2026-08-22T10:00:00.000Z',
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ synced: 1, awarded: 0, unknown: [] }),
      );
    vi.stubGlobal('fetch', fetchMock);
    vi.mocked(calculateKarmaContributions).mockResolvedValueOnce(
      new Map([['google@example.com', 75]]),
    );

    await pushKarmaSync(config);

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({
          accounts: [{ login: 'google@example.com', total: 75 }],
        }),
      }),
    );
  });

  it('accepts legacy linked-user responses without contribution_email', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse({
        users: [
          {
            email: 'google@example.com',
            karma_linked_at: '2026-08-22T10:00:00.000Z',
          },
        ],
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchConsentedEmails(config)).resolves.toStrictEqual([
      {
        contributionEmail: 'google@example.com',
        email: 'google@example.com',
      },
    ]);
  });
});
