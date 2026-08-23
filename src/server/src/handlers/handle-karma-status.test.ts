import { beforeEach, describe, expect, it, vi } from 'vitest';

import findUserById from '../database/find-user-by-id.js';
import {
  getUserKarmaContribution,
  KarmaSourceUnavailableError,
} from '../services/karma-calculator.js';

import handleKarmaStatus from './handle-karma-status.js';

vi.mock('../database/find-user-by-id.js', () => ({ default: vi.fn() }));
vi.mock('../services/karma-calculator.js', () => ({
  getUserKarmaContribution: vi.fn(),
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
    vi.mocked(getUserKarmaContribution).mockResolvedValueOnce(0);
    const json = vi.fn();

    await handleKarmaStatus({
      json,
      var: { userId: 'user-123' },
    } as never);

    expect(json).toHaveBeenCalledWith({
      contribution: 0,
      user: { email: 'missing@example.com', karma_linked_at: null },
    });
    expect(getUserKarmaContribution).toHaveBeenCalledWith(
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
    vi.mocked(getUserKarmaContribution).mockRejectedValueOnce(
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
});
