import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import LoginClient from './login-client';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@react-oauth/google', () => ({
  GoogleLogin: () => <button type="button">Google login</button>,
}));

vi.mock('@/app/services/api', () => ({
  default: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}));

describe('LoginClient', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the login control inside the client component', () => {
    render(<LoginClient />);

    expect(
      screen.getByRole('button', { name: 'Google login' }),
    ).toBeInTheDocument();
  });
});
