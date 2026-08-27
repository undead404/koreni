import { describe, expect, it, vi } from 'vitest';

import handleKarmaLinkedUsers from './handle-karma-linked-users.js';

vi.mock('../database/get-karma-linked-users.js', () => ({
  default: vi.fn(),
}));

vi.mock('../environment.js', () => ({
  default: {
    KARMA_INTERNAL_TOKEN: 'secret_karma_token_123',
  },
}));

describe('handleKarmaLinkedUsers', () => {
  it('returns 401 when Authorization header is missing', async () => {
    const jsonMock = vi.fn();
    const c = {
      json: jsonMock,
      req: {
        header: vi.fn().mockReturnValue(undefined),
      },
    } as never;

    await handleKarmaLinkedUsers(c);

    expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' }, 401);
  });

  it('returns 401 when Bearer token is invalid', async () => {
    const jsonMock = vi.fn();
    const c = {
      json: jsonMock,
      req: {
        header: vi.fn().mockReturnValue('Bearer wrong_token'),
      },
    } as never;

    await handleKarmaLinkedUsers(c);

    expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' }, 401);
  });

  it('returns 401 when environment KARMA_INTERNAL_TOKEN is empty/undefined', async () => {
    const environmentModule = await import('../environment.js');
    const environment = environmentModule.default;
    const originalToken = environment.KARMA_INTERNAL_TOKEN;
    environment.KARMA_INTERNAL_TOKEN = undefined;

    const jsonMock = vi.fn();
    const c = {
      json: jsonMock,
      req: {
        header: vi.fn().mockReturnValue('Bearer secret_karma_token_123'),
      },
    } as never;

    await handleKarmaLinkedUsers(c);

    expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' }, 401);

    environment.KARMA_INTERNAL_TOKEN = originalToken;
  });

  it('returns 200 with linked users list when valid Bearer token is provided', async () => {
    // eslint-disable-next-line unicorn/no-non-function-verb-prefix
    const getKarmaLinkedUsersModule =
      await import('../database/get-karma-linked-users.js');
    const getKarmaLinkedUsersMock =
      getKarmaLinkedUsersModule.default as unknown as ReturnType<typeof vi.fn>;

    const mockUsers = [
      {
        email: 'user1@example.com',
        karma_linked_at: '2026-08-22T10:00:00.000Z',
      },
    ];
    getKarmaLinkedUsersMock.mockResolvedValueOnce(mockUsers);

    const jsonMock = vi.fn((data) => data);
    const c = {
      json: jsonMock,
      req: {
        header: vi.fn().mockImplementation((headerName: string) => {
          if (headerName.toLowerCase() === 'authorization') {
            return 'Bearer secret_karma_token_123';
          }
          return undefined;
        }),
      },
    } as never;

    await handleKarmaLinkedUsers(c);

    expect(jsonMock).toHaveBeenCalledWith({
      users: mockUsers,
    });
  });
});
