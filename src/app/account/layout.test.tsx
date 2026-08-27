import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import AccountLayout, { metadata } from './layout';

vi.mock('@react-oauth/google', () => ({
  GoogleOAuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="google-oauth-provider">{children}</div>
  ),
  googleLogout: vi.fn(),
}));

vi.mock('./components/account-header', () => ({
  default: () => <div data-testid="account-header">Account Header</div>,
}));

vi.mock('@/app/environment', () => ({
  default: {
    NEXT_PUBLIC_OAUTH_CLIENT_ID: 'test-client-id',
  },
}));

describe('AccountLayout', () => {
  afterEach(() => {
    cleanup();
  });

  it('has noindex metadata', () => {
    expect(metadata.title).toBe('Кабінет');
    expect(metadata.robots).toEqual({
      index: false,
      follow: false,
    });
  });

  it('renders children and header within provider', () => {
    render(
      <AccountLayout>
        <div>Account Content</div>
      </AccountLayout>,
    );

    expect(screen.getByTestId('google-oauth-provider')).toBeInTheDocument();
    expect(screen.getByTestId('account-header')).toBeInTheDocument();
    expect(screen.getByText('Account Content')).toBeInTheDocument();
  });
});
