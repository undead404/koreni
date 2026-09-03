import { beforeEach, describe, expect, it, vi } from 'vitest';

import findUserById from '../database/find-user-by-id.js';
import environment from '../environment.js';
import { navigatorClient } from '../services/navigator-client.js';

import handleKarmaLookup from './handle-karma-lookup.js';

vi.mock('../database/find-user-by-id.js', () => ({ default: vi.fn() }));
vi.mock('../services/navigator-client.js', () => ({
  NavigatorClientError: class NavigatorClientError extends Error {},
  navigatorClient: { lookupKarma: vi.fn() },
}));

describe('handleKarmaLookup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    environment.KARMA_APP_SLUG = 'koreni';
  });

  it('returns the authenticated user’s Navigator karma', async () => {
    vi.mocked(findUserById).mockResolvedValueOnce({
      email: 'User@example.com',
      contribution_email: 'contributor@example.com',
      id: 'user-123',
      karma_linked_at: '2026-08-23T12:00:00.000Z',
    } as never);
    vi.mocked(navigatorClient.lookupKarma).mockResolvedValueOnce({
      name: 'Koreni',
      results: [
        {
          found: true,
          serviceKarma: 381,
          totalKarma: 2487,
          user: 'user@example.com',
        },
      ],
      service: 'koreni',
    });
    const json = vi.fn();

    await handleKarmaLookup({
      json,
      var: { userId: 'user-123' },
    } as never);

    expect(navigatorClient.lookupKarma).toHaveBeenCalledWith({
      service: 'koreni',
      users: ['user@example.com'],
    });
    expect(json).toHaveBeenCalledWith({
      found: true,
      serviceKarma: 381,
      totalKarma: 2487,
    });
  });

  it('returns 401 when the authenticated user is missing', async () => {
    vi.mocked(findUserById).mockResolvedValueOnce(undefined);
    const json = vi.fn();

    await handleKarmaLookup({
      json,
      var: { userId: 'missing-user' },
    } as never);

    expect(json).toHaveBeenCalledWith({ user: null }, 401);
    expect(navigatorClient.lookupKarma).not.toHaveBeenCalled();
  });

  it('returns an unavailable response when Navigator fails', async () => {
    vi.mocked(findUserById).mockResolvedValueOnce({
      email: 'user@example.com',
      contribution_email: null,
      id: 'user-123',
      karma_linked_at: '2026-08-23T12:00:00.000Z',
    } as never);
    vi.mocked(navigatorClient.lookupKarma).mockRejectedValueOnce(
      new Error('timeout'),
    );
    const json = vi.fn();

    await handleKarmaLookup({
      json,
      var: { userId: 'user-123' },
    } as never);

    expect(json).toHaveBeenCalledWith(
      { error: 'navigator_lookup_invalid' },
      502,
    );
  });
});
