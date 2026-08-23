import { describe, expect, it, vi } from 'vitest';

import getKarmaLinkedUsers from './get-karma-linked-users.js';

vi.mock('./client.js', () => {
  const mockExecute = vi.fn();
  const mockWhere = vi.fn().mockReturnValue({ execute: mockExecute });
  const mockSelect = vi.fn().mockReturnValue({ where: mockWhere });
  const mockSelectFrom = vi.fn().mockReturnValue({ select: mockSelect });

  return {
    default: {
      selectFrom: mockSelectFrom,
    },
    mockExecute,
    mockSelectFrom,
    mockWhere,
  };
});

describe('getKarmaLinkedUsers', () => {
  it('queries users table where karma_linked_at IS NOT NULL', async () => {
    const { mockExecute, mockSelectFrom, mockWhere } =
      (await import('./client.js')) as unknown as {
        mockExecute: ReturnType<typeof vi.fn>;
        mockSelectFrom: ReturnType<typeof vi.fn>;
        mockWhere: ReturnType<typeof vi.fn>;
      };

    const mockLinkedUsers = [
      {
        email: 'opted_in@example.com',
        contribution_email: null,
        karma_linked_at: '2026-08-22T10:00:00Z',
      },
    ];
    mockExecute.mockResolvedValueOnce(mockLinkedUsers);

    const result = await getKarmaLinkedUsers();

    expect(mockSelectFrom).toHaveBeenCalledWith('users');
    expect(mockWhere).toHaveBeenCalledWith('karma_linked_at', 'is not', null);
    expect(result).toStrictEqual([
      {
        email: 'opted_in@example.com',
        karma_linked_at: '2026-08-22T10:00:00Z',
      },
    ]);
  });

  it('uses the contribution email for linked users when available', async () => {
    const { mockExecute } = (await import('./client.js')) as unknown as {
      mockExecute: ReturnType<typeof vi.fn>;
    };
    mockExecute.mockResolvedValueOnce([
      {
        email: 'google@example.com',
        contribution_email: '  Contributor@Example.com ',
        karma_linked_at: '2026-08-22T10:00:00Z',
      },
    ]);

    await expect(getKarmaLinkedUsers()).resolves.toStrictEqual([
      {
        email: 'contributor@example.com',
        karma_linked_at: '2026-08-22T10:00:00Z',
      },
    ]);
  });
});
