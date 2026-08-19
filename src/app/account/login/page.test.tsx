import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import requestApi from '@/app/services/api';

import NotificationProvider from '../notification-provider';

import AccountLoginPage from './page';

const mockReplace = vi.fn();
const mockGoogleLogin = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

vi.mock('@/app/services/api');

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
  Toaster: (properties: Record<string, unknown>) => (
    <section
      data-testid="sonner-toaster"
      aria-label="Notifications"
      {...properties}
    />
  ),
}));

interface MockGoogleLoginProperties {
  onError?: () => void;
  onSuccess?: (credentialResponse: { credential?: string }) => void;
  useOneTap?: boolean;
}

vi.mock('@react-oauth/google', () => ({
  GoogleLogin: (properties: MockGoogleLoginProperties) => {
    mockGoogleLogin(properties);
    return (
      <div data-testid="google-login-button">
        <button
          type="button"
          onClick={() =>
            properties.onSuccess?.({ credential: 'valid-test-credential' })
          }
        >
          Simulate Success
        </button>
        <button
          type="button"
          onClick={() => properties.onSuccess?.({ credential: '' })}
        >
          Simulate Empty Credential
        </button>
        <button type="button" onClick={() => properties.onError?.()}>
          Simulate Error
        </button>
      </div>
    );
  },
}));

describe('AccountLoginPage', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders exactly one Google login control and does not enable One Tap', () => {
    render(<AccountLoginPage />);

    expect(screen.getByTestId('google-login-button')).toBeInTheDocument();
    expect(mockGoogleLogin).toHaveBeenCalledTimes(1);

    const passedProperties = mockGoogleLogin.mock
      .calls[0][0] as MockGoogleLoginProperties;
    expect(passedProperties.useOneTap).toBeUndefined();
  });

  it('handles successful credentials, POSTs payload, and navigates to /account', async () => {
    vi.mocked(requestApi).mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    render(<AccountLoginPage />);

    fireEvent.click(screen.getByRole('button', { name: /Simulate Success/i }));

    await waitFor(() => {
      expect(requestApi).toHaveBeenCalledTimes(1);
      expect(requestApi).toHaveBeenCalledWith('/api/auth/google', {
        body: JSON.stringify({ credential: 'valid-test-credential' }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });
      expect(mockReplace).toHaveBeenCalledWith('/account');
    });
  });

  it('handles missing credential gracefully without calling API', () => {
    render(<AccountLoginPage />);

    fireEvent.click(
      screen.getByRole('button', { name: /Simulate Empty Credential/i }),
    );

    expect(requestApi).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Google login failed');
  });

  it('handles Google SDK login failure notification', () => {
    render(<AccountLoginPage />);

    fireEvent.click(screen.getByRole('button', { name: /Simulate Error/i }));

    expect(toast.error).toHaveBeenCalledWith('Google login failed');
  });

  it('handles API failure notification without navigating', async () => {
    vi.mocked(requestApi).mockRejectedValue(new Error('Network error'));

    render(<AccountLoginPage />);

    fireEvent.click(screen.getByRole('button', { name: /Simulate Success/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to authenticate');
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  it('remounts without issuing One Tap prompts or duplicate initialization', () => {
    const { unmount } = render(<AccountLoginPage />);

    expect(mockGoogleLogin).toHaveBeenCalledTimes(1);

    unmount();

    render(<AccountLoginPage />);

    expect(mockGoogleLogin).toHaveBeenCalledTimes(2);

    for (const call of mockGoogleLogin.mock.calls) {
      const properties = call[0] as MockGoogleLoginProperties;
      expect(properties.useOneTap).not.toBe(true);
    }
  });

  it('renders NotificationProvider alongside login page with exactly one Toaster', () => {
    render(
      <>
        <NotificationProvider />
        <AccountLoginPage />
      </>,
    );

    expect(screen.getByTestId('sonner-toaster')).toBeInTheDocument();
    expect(screen.getAllByTestId('sonner-toaster')).toHaveLength(1);
  });

  it('triggers login failure notification when rendered with NotificationProvider', async () => {
    vi.mocked(requestApi).mockRejectedValue(new Error('Auth error'));

    render(
      <>
        <NotificationProvider />
        <AccountLoginPage />
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Simulate Success/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to authenticate');
    });

    expect(screen.getByTestId('sonner-toaster')).toBeInTheDocument();
  });
});
