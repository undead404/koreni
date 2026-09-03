import { beforeEach, describe, expect, it, vi } from 'vitest';

import findUserById from '../database/find-user-by-id.js';
import {
  getUserKarmaContributionStats,
  KarmaSourceUnavailableError,
} from '../services/karma-calculator.js';

import handleKarmaStatus from './handle-karma-status.js';

vi.mock('../database/find-user-by-id.js', () => ({ default: vi.fn() }));
vi.mock('../services/karma-calculator.js', () => ({
  getUserKarmaContributionStats: vi.fn(),
  KarmaSourceUnavailableError: class KarmaSourceUnavailableError extends Error {},
}));

describe('handleKarmaStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns zero for a successfully calculated empty contribution', async () => {
    vi.mocked(findUserById).mockResolvedValueOnce({
      email: 'missing@example.com',
      contribution_email: null,
      id: 'user-123',
      karma_linked_at: null,
    } as never);
    vi.mocked(getUserKarmaContributionStats).mockResolvedValueOnce({
      tableCount: 0,
      rowCount: 0,
    });
    const json = vi.fn();

    await handleKarmaStatus({
      json,
      var: { userId: 'user-123' },
    } as never);

    expect(json).toHaveBeenCalledWith({
      tables: 0,
      rows: 0,
      user: { email: 'missing@example.com', karma_linked_at: null },
    });
    expect(getUserKarmaContributionStats).toHaveBeenCalledWith(
      'missing@example.com',
      { requestId: undefined },
    );
  });

  it('returns 502 when the karma source is unavailable', async () => {
    vi.mocked(findUserById).mockResolvedValueOnce({
      email: 'brute18@gmail.com',
      contributionEmail: null,
      id: 'user-123',
      karma_linked_at: null,
    } as never);
    vi.mocked(getUserKarmaContributionStats).mockRejectedValueOnce(
      new KarmaSourceUnavailableError(),
    );
    const json = vi.fn();

    await handleKarmaStatus({
      json,
      var: { userId: 'user-123' },
    } as never);

    expect(json).toHaveBeenCalledWith(
      { error: 'Karma source unavailable' },
      502,
    );
  });

  it('uses the contribution email for local statistics and the primary email in the response', async () => {
    vi.mocked(findUserById).mockResolvedValueOnce({
      email: 'google@example.com',
      contribution_email: 'contributor@example.com',
      id: 'user-123',
      karma_linked_at: '2026-08-22T10:00:00.000Z',
    } as never);
    vi.mocked(getUserKarmaContributionStats).mockResolvedValueOnce({
      tableCount: 2,
      rowCount: 4,
    });
    const json = vi.fn();

    await handleKarmaStatus({
      json,
      var: { userId: 'user-123', requestId: 'request-123' },
    } as never);

    expect(getUserKarmaContributionStats).toHaveBeenCalledWith(
      'contributor@example.com',
      { requestId: 'request-123' },
    );
    expect(json).toHaveBeenCalledWith({
      tables: 2,
      rows: 4,
      user: {
        email: 'google@example.com',
        karma_linked_at: '2026-08-22T10:00:00.000Z',
      },
    });
  });
});
