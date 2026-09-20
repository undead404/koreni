import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import requestApi from '@/app/services/api';

import AccountPage from './page';

const mockReplace = vi.fn();
const mockEnvironment = vi.hoisted(() => ({
  NEXT_PUBLIC_ENABLE_TRANSCRIBE: true,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

vi.mock('@/app/services/api');

vi.mock('@/app/environment', () => ({
  default: mockEnvironment,
}));

describe('AccountPage', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockEnvironment.NEXT_PUBLIC_ENABLE_TRANSCRIBE = true;
  });

  it('renders account information when authenticated', async () => {
    vi.mocked(requestApi).mockResolvedValue(
      Response.json(
        { user: { email: 'user@example.com', id: '1' } },
        { status: 200 },
      ),
    );

    render(<AccountPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/Ви увійшли як user@example.com/i),
      ).toBeInTheDocument();
    });
  });

  it('does not present contribution history on the account overview', async () => {
    vi.mocked(requestApi).mockResolvedValue(
      Response.json(
        { user: { email: 'user@example.com', id: '1' } },
        { status: 200 },
      ),
    );

    render(<AccountPage />);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Ваш кабінет' }),
      ).toBeInTheDocument();
    });
    expect(screen.queryByText(/Мої внески/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Переглянути карму/i }),
    ).toBeInTheDocument();
  });

  it('renders the transcription link when transcription is enabled', async () => {
    vi.mocked(requestApi).mockResolvedValue(
      Response.json(
        { user: { email: 'user@example.com', id: '1' } },
        { status: 200 },
      ),
    );

    render(<AccountPage />);

    const transcriptionLink = await screen.findByRole('link', {
      name: 'Проєкти',
    });
    expect(transcriptionLink).toHaveAttribute('href', '/account/transcribe');
  });

  it('hides the transcription link when transcription is disabled', async () => {
    mockEnvironment.NEXT_PUBLIC_ENABLE_TRANSCRIBE = false;
    vi.mocked(requestApi).mockResolvedValue(
      Response.json(
        { user: { email: 'user@example.com', id: '1' } },
        { status: 200 },
      ),
    );

    render(<AccountPage />);

    await screen.findByRole('heading', { name: 'Ваш кабінет' });
    expect(
      screen.queryByRole('link', { name: 'Проєкти' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Переглянути карму/i }),
    ).toBeInTheDocument();
  });

  it('redirects to /account/login when unauthenticated', async () => {
    vi.mocked(requestApi).mockRejectedValue(new Error('Unauthorized'));

    render(<AccountPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/account/login');
    });
  });
});
