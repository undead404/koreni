import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import requestApi from '@/app/services/api';

import AccountHeader from './account-header';

const mockUsePathname = vi.fn().mockReturnValue('/account');
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

vi.mock('@/app/services/api', () => ({
  default: vi.fn(),
}));

vi.mock('./logout-button', () => ({
  default: () => <button>Log Out</button>,
}));

describe('AccountHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('hides logout button on /account while in loading state', () => {
    mockUsePathname.mockReturnValue('/account');
    vi.mocked(requestApi).mockReturnValue(new Promise(() => {}));

    render(<AccountHeader />);

    expect(screen.getByText('Authentication')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Log Out' }),
    ).not.toBeInTheDocument();
  });

  it('hides identity and logout button on /account when unauthenticated', async () => {
    mockUsePathname.mockReturnValue('/account');
    vi.mocked(requestApi).mockRejectedValue(new Error('Request failed'));

    render(<AccountHeader />);

    expect(screen.getByText('Authentication')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/account/login');
    });

    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Log Out' }),
    ).not.toBeInTheDocument();
  });

  it('renders identity and logout button on /account when authenticated', async () => {
    mockUsePathname.mockReturnValue('/account');
    vi.mocked(requestApi).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ user: { email: 'user@example.com', id: 'usr_1' } }),
    } as Response);

    render(<AccountHeader />);

    expect(screen.getByText('Authentication')).toBeInTheDocument();
    expect(await screen.findByText('user@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log Out' })).toBeInTheDocument();
  });

  it('hides all user controls on /account/login and /account/login/ regardless of auth state', () => {
    for (const pathname of ['/account/login', '/account/login/']) {
      mockUsePathname.mockReturnValue(pathname);

      const { unmount } = render(<AccountHeader />);

      expect(screen.getByText('Authentication')).toBeInTheDocument();
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Log Out' }),
      ).not.toBeInTheDocument();
      expect(requestApi).not.toHaveBeenCalled();

      unmount();
    }
  });
});
