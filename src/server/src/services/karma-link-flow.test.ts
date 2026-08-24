import { beforeEach, describe, expect, it, vi } from 'vitest';

import { linkUserKarma } from '../database/link-user-karma.js';

import { getUserKarmaContribution } from './karma-calculator.js';
import { executeUserAccountLink } from './karma-link-flow.js';
import { navigatorClient, NavigatorClientError } from './navigator-client.js';

vi.mock('../database/link-user-karma.js', () => ({
  linkUserKarma: vi.fn(),
}));

vi.mock('./karma-calculator.js', () => ({
  getUserKarmaContribution: vi.fn(),
}));

vi.mock('./navigator-client.js', () => {
  class MockNavigatorClientError extends Error {
    constructor(
      message: string,
      public statusCode: number,
      public errorCode?: string,
    ) {
      super(message);
      this.name = 'NavigatorClientError';
    }
  }

  return {
    navigatorClient: {
      redeemLinkCode: vi.fn(),
    },
    NavigatorClientError: MockNavigatorClientError,
  };
});

describe('executeUserAccountLink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calculates contribution, redeems code with Navigator, and updates DB on success', async () => {
    vi.mocked(getUserKarmaContribution).mockResolvedValueOnce(150);
    vi.mocked(navigatorClient.redeemLinkCode).mockResolvedValueOnce({
      ok: true,
      awarded: 150,
    });
    vi.mocked(linkUserKarma).mockResolvedValueOnce(undefined);

    const result = await executeUserAccountLink({
      userId: 'user-123',
      contributionEmail: '  Contribution.User@Example.com  ',
      email: '  Test.User@Example.com  ',
      code: 'AB12CD34EF',
    });

    expect(getUserKarmaContribution).toHaveBeenCalledWith(
      'contribution.user@example.com',
    );
    expect(navigatorClient.redeemLinkCode).toHaveBeenCalledWith({
      code: 'AB12CD34EF',
      login: 'contribution.user@example.com',
      total: 150,
    });
    expect(linkUserKarma).toHaveBeenCalledWith('user-123', expect.any(String));
    expect(result).toEqual({ ok: true, awarded: 150 });
  });

  it('does not update DB if Navigator code redemption fails with invalid_or_expired', async () => {
    vi.mocked(getUserKarmaContribution).mockResolvedValueOnce(50);
    vi.mocked(navigatorClient.redeemLinkCode).mockRejectedValueOnce(
      new NavigatorClientError('invalid_or_expired', 404, 'invalid_or_expired'),
    );

    await expect(
      executeUserAccountLink({
        userId: 'user-123',
        contributionEmail: null,
        email: 'user@example.com',
        code: 'EXPIRED_CODE',
      }),
    ).rejects.toThrow('invalid_or_expired');

    expect(linkUserKarma).not.toHaveBeenCalled();
  });

  it('does not update DB if Navigator code redemption fails with already_linked', async () => {
    vi.mocked(getUserKarmaContribution).mockResolvedValueOnce(50);
    vi.mocked(navigatorClient.redeemLinkCode).mockRejectedValueOnce(
      new NavigatorClientError('already_linked', 409, 'already_linked'),
    );

    await expect(
      executeUserAccountLink({
        userId: 'user-123',
        contributionEmail: null,
        email: 'user@example.com',
        code: 'LINKED_CODE',
      }),
    ).rejects.toThrow('already_linked');

    expect(linkUserKarma).not.toHaveBeenCalled();
  });
});
