import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getAllKarmaStats: vi.fn(),
  getUserKarmaStats: vi.fn(),
  resetKarmaMetadataCache: vi.fn(),
}));

vi.mock('./karma-source.js', () => ({
  getAllKarmaStats: mocks.getAllKarmaStats,
  getUserKarmaStats: mocks.getUserKarmaStats,
  resetKarmaMetadataCache: mocks.resetKarmaMetadataCache,
  KarmaSourceUnavailableError: class KarmaSourceUnavailableError extends Error {},
}));

import {
  calculateKarmaContributions,
  getUserKarmaContribution,
  getUserKarmaContributionStats,
  resetKarmaMetadataCache,
} from './karma-calculator.js';

describe('karma-calculator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetKarmaMetadataCache();
  });

  it('normalizes the email before looking up a user', async () => {
    mocks.getUserKarmaStats.mockResolvedValueOnce({
      contribution: 5,
      rowCount: 2,
      tableCount: 1,
    });

    await expect(getUserKarmaContribution(' USER@example.com ')).resolves.toBe(
      5,
    );
    expect(mocks.getUserKarmaStats).toHaveBeenCalledWith('user@example.com', {
      requestId: 'internal',
    });
  });

  it('returns zero statistics for an unknown user', async () => {
    mocks.getUserKarmaStats.mockResolvedValueOnce({
      contribution: 0,
      rowCount: 0,
      tableCount: 0,
    });

    await expect(
      getUserKarmaContributionStats('missing@example.com'),
    ).resolves.toStrictEqual({ tableCount: 0, rowCount: 0 });
  });

  it('returns all indexed contribution totals for synchronization', async () => {
    mocks.getAllKarmaStats.mockResolvedValueOnce({
      generatedAt: '2026-08-24T00:00:00.000Z',
      revision: 'revision',
      users: {
        'user@example.com': { contribution: 5, rowCount: 2, tableCount: 1 },
      },
      version: 1,
    });

    await expect(calculateKarmaContributions()).resolves.toStrictEqual(
      new Map([['user@example.com', 5]]),
    );
  });
});
