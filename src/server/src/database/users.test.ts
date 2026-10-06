import { beforeEach, describe, expect, it, vi } from 'vitest';

import getEmailVisibilitySuppressions from './get-email-visibility-suppressions.js';
import getKarmaLinkedUsers from './get-karma-linked-users.js';
import updateUserEmailVisibility from './update-user-email-visibility.js';
import upsertUser from './upsert-user.js';

const mocks = vi.hoisted(() => ({
  execute: vi.fn(),
  executeTakeFirst: vi.fn(),
  executeTakeFirstOrThrow: vi.fn(),
  insertInto: vi.fn(),
  onConflict: vi.fn(),
  returningAll: vi.fn(),
  select: vi.fn(),
  selectFrom: vi.fn(),
  set: vi.fn(),
  updateTable: vi.fn(),
  values: vi.fn(),
  where: vi.fn(),
}));

vi.mock('./client.js', () => ({
  default: {
    insertInto: mocks.insertInto,
    selectFrom: mocks.selectFrom,
    updateTable: mocks.updateTable,
  },
}));

describe('user database operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.selectFrom.mockReturnValue({ select: mocks.select });
    mocks.select.mockReturnValue({ where: mocks.where });
    mocks.where.mockReturnValue({
      execute: mocks.execute,
      executeTakeFirst: mocks.executeTakeFirst,
    });
    mocks.updateTable.mockReturnValue({ set: mocks.set });
    mocks.set.mockReturnValue({ where: mocks.where });
    mocks.insertInto.mockReturnValue({ values: mocks.values });
    mocks.values.mockReturnValue({ onConflict: mocks.onConflict });
    mocks.onConflict.mockReturnValue({ returningAll: mocks.returningAll });
    mocks.returningAll.mockReturnValue({
      executeTakeFirstOrThrow: mocks.executeTakeFirstOrThrow,
    });
  });

  it('queries users where karma_linked_at IS NOT NULL', async () => {
    const linkedUsers = [
      {
        contribution_email: null,
        email: 'opted_in@example.com',
        karma_linked_at: '2026-08-22T10:00:00Z',
      },
    ];
    mocks.execute.mockResolvedValueOnce(linkedUsers);

    const result = await getKarmaLinkedUsers();

    expect(mocks.selectFrom).toHaveBeenCalledWith('users');
    expect(mocks.where).toHaveBeenCalledWith('karma_linked_at', 'is not', null);
    expect(result).toStrictEqual([
      {
        contribution_email: null,
        email: 'opted_in@example.com',
        karma_linked_at: '2026-08-22T10:00:00Z',
      },
    ]);
  });

  it('preserves the primary email separately from the contribution email', async () => {
    mocks.execute.mockResolvedValueOnce([
      {
        email: 'google@example.com',
        contribution_email: '  Contributor@Example.com ',
        karma_linked_at: '2026-08-22T10:00:00Z',
      },
    ]);

    await expect(getKarmaLinkedUsers()).resolves.toStrictEqual([
      {
        contribution_email: 'contributor@example.com',
        email: 'google@example.com',
        karma_linked_at: '2026-08-22T10:00:00Z',
      },
    ]);
  });

  it('updates visibility only for the supplied user ID', async () => {
    mocks.executeTakeFirst.mockResolvedValueOnce({ numUpdatedRows: 1n });

    await expect(updateUserEmailVisibility('user-id', false)).resolves.toBe(1n);

    expect(mocks.updateTable).toHaveBeenCalledWith('users');
    expect(mocks.set).toHaveBeenCalledWith({ show_email: 0 });
    expect(mocks.where).toHaveBeenCalledWith('id', '=', 'user-id');
  });

  it('projects normalized and deduplicated login and linked email suppressions', async () => {
    mocks.execute.mockResolvedValueOnce([
      {
        contribution_email: ' Login@Example.com ',
        email: 'LOGIN@example.com ',
      },
      {
        contribution_email: ' alias@example.com ',
        email: 'Second@example.com',
      },
    ]);

    await expect(getEmailVisibilitySuppressions()).resolves.toStrictEqual([
      'login@example.com',
      'second@example.com',
      'alias@example.com',
    ]);
    expect(mocks.where).toHaveBeenCalledWith('show_email', '=', 0);
  });

  it('leaves the visibility column to its default and preserves linked email on OAuth upsert', async () => {
    const doUpdateSet = vi.fn();
    mocks.executeTakeFirstOrThrow.mockResolvedValueOnce({
      id: 'user-id',
      show_email: 0,
      contribution_email: 'linked@example.com',
    });
    mocks.onConflict.mockImplementationOnce((configure) => {
      configure({ column: vi.fn(() => ({ doUpdateSet })) });
      return { returningAll: mocks.returningAll };
    });

    await upsertUser({ email: 'refreshed@example.com', googleId: 'google-id' });

    expect(mocks.values).toHaveBeenCalledWith({
      id: expect.any(String),
      google_id: 'google-id',
      email: 'refreshed@example.com',
    });
    expect(mocks.values.mock.calls[0][0]).not.toHaveProperty('show_email');
    expect(doUpdateSet).toHaveBeenCalledWith({
      email: 'refreshed@example.com',
    });
  });
});
