import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import requestApi from '@/app/services/api';

import AccountPage from './page';

const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

vi.mock('@/app/services/api');

describe('AccountPage', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders account information when authenticated', async () => {
    vi.mocked(requestApi).mockResolvedValue(
      new Response(
        JSON.stringify({ user: { email: 'user@example.com', id: '1' } }),
        { status: 200 },
      ),
    );

    render(<AccountPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/Authenticated as: user@example.com/i),
      ).toBeInTheDocument();
    });
  });

  it('redirects to /account/login when unauthenticated', async () => {
    vi.mocked(requestApi).mockRejectedValue(new Error('Unauthorized'));

    render(<AccountPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/account/login');
    });
  });
});
