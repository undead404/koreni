import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getContent: vi.fn(),
}));

vi.mock('octokit', () => ({
  Octokit: class OctokitMock {
    rest = { repos: { getContent: mocks.getContent } };
  },
}));

vi.mock('../environment.js', () => ({
  default: {
    GITHUB_REPO: 'owner/repo',
    GITHUB_TOKEN: 'token',
  },
}));

import {
  getUserKarmaContribution,
  getUserKarmaContributionStats,
  KarmaSourceUnavailableError,
  resetKarmaMetadataCache,
} from './karma-calculator.js';

describe('karma-calculator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetKarmaMetadataCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns zero after successfully loading a dataset with no matching email', async () => {
    mocks.getContent.mockResolvedValueOnce({ data: [] });

    await expect(getUserKarmaContribution('missing@example.com')).resolves.toBe(
      0,
    );
  });

  it('propagates GitHub source failures instead of returning zero', async () => {
    mocks.getContent.mockRejectedValueOnce(new Error('401 Unauthorized'));

    await expect(
      getUserKarmaContribution('brute18@gmail.com'),
    ).rejects.toBeInstanceOf(KarmaSourceUnavailableError);
  });

  it('propagates an unexpected GitHub directory response', async () => {
    mocks.getContent.mockResolvedValueOnce({ data: { type: 'file' } });

    await expect(
      getUserKarmaContribution('brute18@gmail.com'),
    ).rejects.toBeInstanceOf(KarmaSourceUnavailableError);
  });

  it('fetches CSV data only for records belonging to the requested user', async () => {
    mocks.getContent.mockResolvedValueOnce({
      data: [
        {
          name: 'matching.yaml',
          path: 'data/records/matching.yaml',
          type: 'file',
        },
        { name: 'other.yaml', path: 'data/records/other.yaml', type: 'file' },
      ],
    });
    const fetchMock = vi.fn((url: string) => {
      if (url.endsWith('matching.yaml')) {
        return new Response(
          'authorEmail: user@example.com\ntableFilePath: data/csv/matching.csv\ntitle: Matching',
        );
      }
      if (url.endsWith('other.yaml')) {
        return new Response(
          'authorEmail: other@example.com\ntableFilePath: data/csv/other.csv\ntitle: Other',
        );
      }
      if (url.endsWith('matching.csv')) {
        return new Response('name\nAlice\nAlice\n');
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(getUserKarmaContribution(' USER@example.com ')).resolves.toBe(
      5,
    );

    await expect(
      getUserKarmaContributionStats(' USER@example.com '),
    ).resolves.toStrictEqual({ tableCount: 1, rowCount: 2 });

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining('other.csv'),
    );
  });

  it('counts only rows containing at least one letter', async () => {
    mocks.getContent.mockResolvedValueOnce({
      data: [{ name: 'matching.yaml', path: 'matching.yaml', type: 'file' }],
    });
    const fetchMock = vi.fn((url: string) => {
      if (url.endsWith('matching.yaml')) {
        return Promise.resolve(
          new Response(
            'authorEmail: user@example.com\ntableFilePath: data/csv/matching.csv\ntitle: Matching',
          ),
        );
      }
      return Promise.resolve(
        new Response('name,number\nІван,123\n456,789\n,Київ\n,\n'),
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      getUserKarmaContributionStats('user@example.com'),
    ).resolves.toStrictEqual({ tableCount: 1, rowCount: 2 });
  });
});
