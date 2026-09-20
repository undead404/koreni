import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import requestApi from '@/app/services/api';

import UserView from './user';

const mockReplace = vi.fn();
const mockSearchParameters = new URLSearchParams();

vi.mock('next/navigation', () => ({
  usePathname: () => '/account/karma',
  useRouter: () => ({
    replace: mockReplace,
  }),
  useSearchParams: () => mockSearchParameters,
}));

vi.mock('@/app/services/api', () => ({
  default: vi.fn(),
}));

vi.mock('./logout-button', () => ({
  default: () => <button>Log Out</button>,
}));

describe('UserView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders loading state initially', () => {
    vi.mocked(requestApi).mockReturnValue(new Promise(() => {}));

    render(<UserView />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Log Out' }),
    ).not.toBeInTheDocument();
  });

  it('renders user email and logout button on successful auth response', async () => {
    vi.mocked(requestApi).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ user: { email: 'user@example.com', id: 'usr_1' } }),
    } as Response);

    render(<UserView />);

    expect(await screen.findByText('user@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log Out' })).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    expect(requestApi).toHaveBeenCalledWith('/api/auth/me');
  });

  it('does not render identity or logout control on 401 response and redirects to login', async () => {
    vi.mocked(requestApi).mockRejectedValue(new Error('Request failed'));

    render(<UserView />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        '/account/login?returnTo=%2Faccount%2Fkarma',
      );
    });

    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Log Out' }),
    ).not.toBeInTheDocument();
  });

  it('does not render identity or logout control on network failure', async () => {
    vi.mocked(requestApi).mockRejectedValue(new Error('Network error'));

    render(<UserView />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        '/account/login?returnTo=%2Faccount%2Fkarma',
      );
    });

    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Log Out' }),
    ).not.toBeInTheDocument();
  });

  it('treats malformed response as unauthenticated and redirects', async () => {
    vi.mocked(requestApi).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ invalid_payload: true }),
    } as Response);

    render(<UserView />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        '/account/login?returnTo=%2Faccount%2Fkarma',
      );
    });

    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Log Out' }),
    ).not.toBeInTheDocument();
  });

  it('treats response with user: null as unauthenticated and redirects', async () => {
    vi.mocked(requestApi).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ user: null }),
    } as Response);

    render(<UserView />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        '/account/login?returnTo=%2Faccount%2Fkarma',
      );
    });

    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Log Out' }),
    ).not.toBeInTheDocument();
  });

  it('prevents post-request state mutation if unmounted', async () => {
    const { promise: pendingPromise, resolve: resolvePromise } =
      Promise.withResolvers<Response>();
    vi.mocked(requestApi).mockReturnValue(pendingPromise);

    const { unmount } = render(<UserView />);

    unmount();

    resolvePromise({
      ok: true,
      json: () =>
        Promise.resolve({ user: { email: 'user@example.com', id: 'usr_1' } }),
    } as Response);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(mockReplace).not.toHaveBeenCalled();
  });
});
