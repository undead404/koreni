import { beforeEach, describe, expect, it, vi } from 'vitest';

import findUserById from '../database/find-user-by-id.js';
import { executeUserAccountLink } from '../services/karma-link-flow.js';
import { NavigatorClientError } from '../services/navigator-client.js';

import handleKarmaLink from './handle-karma-link.js';

vi.mock('../database/find-user-by-id.js', () => ({
  default: vi.fn(),
}));

vi.mock('../services/karma-link-flow.js', () => ({
  executeUserAccountLink: vi.fn(),
}));

vi.mock('../services/navigator-client.js', () => {
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
    NavigatorClientError: MockNavigatorClientError,
  };
});

describe('handleKarmaLink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when c.var.userId is missing', async () => {
    const jsonMock = vi.fn();
    const c = {
      json: jsonMock,
      var: {},
    } as never;

    await handleKarmaLink(c);

    expect(jsonMock).toHaveBeenCalledWith({ user: null }, 401);
  });

  it('returns 401 when user is not found in DB', async () => {
    vi.mocked(findUserById).mockResolvedValueOnce(undefined);

    const jsonMock = vi.fn();
    const c = {
      json: jsonMock,
      var: { userId: 'user-123' },
    } as never;

    await handleKarmaLink(c);

    expect(findUserById).toHaveBeenCalledWith('user-123');
    expect(jsonMock).toHaveBeenCalledWith({ user: null }, 401);
  });

  it('returns 400 when body cannot be parsed as JSON', async () => {
    vi.mocked(findUserById).mockResolvedValueOnce({
      email: 'test@example.com',
      id: 'user-123',
    } as never);

    const jsonMock = vi.fn();
    const c = {
      json: jsonMock,
      req: {
        json: vi.fn().mockRejectedValueOnce(new Error('SyntaxError')),
      },
      var: { userId: 'user-123' },
    } as never;

    await handleKarmaLink(c);

    expect(jsonMock).toHaveBeenCalledWith({ error: 'invalid_request' }, 400);
  });

  it('returns 400 when code is missing or empty', async () => {
    vi.mocked(findUserById).mockResolvedValueOnce({
      email: 'test@example.com',
      id: 'user-123',
    } as never);

    const jsonMock = vi.fn();
    const c = {
      json: jsonMock,
      req: {
        json: vi.fn().mockResolvedValueOnce({ code: '' }),
      },
      var: { userId: 'user-123' },
    } as never;

    await handleKarmaLink(c);

    expect(jsonMock).toHaveBeenCalledWith({ error: 'invalid_request' }, 400);
  });

  it('invokes executeUserAccountLink and returns 200 on success', async () => {
    vi.mocked(findUserById).mockResolvedValueOnce({
      email: 'test@example.com',
      id: 'user-123',
    } as never);
    vi.mocked(executeUserAccountLink).mockResolvedValueOnce({
      awarded: 120,
      ok: true,
    });

    const jsonMock = vi.fn();
    const c = {
      json: jsonMock,
      req: {
        json: vi.fn().mockResolvedValueOnce({ code: 'AB12CD34EF' }),
      },
      var: { userId: 'user-123' },
    } as never;

    await handleKarmaLink(c);

    expect(executeUserAccountLink).toHaveBeenCalledWith({
      code: 'AB12CD34EF',
      email: 'test@example.com',
      userId: 'user-123',
    });
    expect(jsonMock).toHaveBeenCalledWith({ awarded: 120, ok: true }, 200);
  });

  it('returns 404 when NavigatorClientError is invalid_or_expired', async () => {
    vi.mocked(findUserById).mockResolvedValueOnce({
      email: 'test@example.com',
      id: 'user-123',
    } as never);
    vi.mocked(executeUserAccountLink).mockRejectedValueOnce(
      new NavigatorClientError('invalid_or_expired', 404, 'invalid_or_expired'),
    );

    const jsonMock = vi.fn();
    const c = {
      json: jsonMock,
      req: {
        json: vi.fn().mockResolvedValueOnce({ code: 'EXPIRED_CODE' }),
      },
      var: { userId: 'user-123' },
    } as never;

    await handleKarmaLink(c);

    expect(jsonMock).toHaveBeenCalledWith({ error: 'invalid_or_expired' }, 404);
  });

  it('returns 409 when NavigatorClientError is already_linked', async () => {
    vi.mocked(findUserById).mockResolvedValueOnce({
      email: 'test@example.com',
      id: 'user-123',
    } as never);
    vi.mocked(executeUserAccountLink).mockRejectedValueOnce(
      new NavigatorClientError('already_linked', 409, 'already_linked'),
    );

    const jsonMock = vi.fn();
    const c = {
      json: jsonMock,
      req: {
        json: vi.fn().mockResolvedValueOnce({ code: 'ALREADY_LINKED' }),
      },
      var: { userId: 'user-123' },
    } as never;

    await handleKarmaLink(c);

    expect(jsonMock).toHaveBeenCalledWith({ error: 'already_linked' }, 409);
  });

  it('returns 500 when an unhandled error is thrown', async () => {
    vi.mocked(findUserById).mockResolvedValueOnce({
      email: 'test@example.com',
      id: 'user-123',
    } as never);
    vi.mocked(executeUserAccountLink).mockRejectedValueOnce(
      new Error('Database error'),
    );

    const jsonMock = vi.fn();
    const c = {
      json: jsonMock,
      req: {
        json: vi.fn().mockResolvedValueOnce({ code: 'CODE123' }),
      },
      var: { userId: 'user-123' },
    } as never;

    await handleKarmaLink(c);

    expect(jsonMock).toHaveBeenCalledWith({ error: 'Database error' }, 500);
  });
});
