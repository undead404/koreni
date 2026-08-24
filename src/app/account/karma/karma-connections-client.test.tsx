import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import requestApi from '@/app/services/api';

import KarmaConnectionsClient from './karma-connections-client';

const searchParameters = new URLSearchParams();

vi.mock('next/navigation', () => ({
  usePathname: () => '/account/karma',
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => searchParameters,
}));

vi.mock('@/app/services/api', () => ({
  default: vi.fn(),
  ApiRequestError: class ApiRequestError extends Error {
    public readonly status: number;

    public constructor(status: number) {
      super();
      this.status = status;
    }
  },
}));

describe('KarmaConnectionsClient', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the loading state inside the client component', () => {
    vi.mocked(requestApi).mockReturnValue(new Promise(() => {}));

    render(<KarmaConnectionsClient />);

    expect(screen.getByText('Завантаження...')).toBeInTheDocument();
  });
});
