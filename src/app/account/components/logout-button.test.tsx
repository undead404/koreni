import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import environment from '../../environment';

const { mockConfirmNavigation, mockReplace, mockGoogleLogout } = vi.hoisted(
  () => ({
    mockConfirmNavigation: vi.fn<() => boolean>(),
    mockReplace: vi.fn(),
    mockGoogleLogout: vi.fn(),
  }),
);

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

vi.mock('@react-oauth/google', () => ({ googleLogout: mockGoogleLogout }));

vi.mock('@/app/hooks/use-unsaved-changes', () => ({
  useUnsavedChanges: () => ({ confirmNavigation: mockConfirmNavigation }),
}));

import LogoutButton from './logout-button';

let logoutRequestCount = 0;
const logoutEndpoint = new URL(
  '/api/auth/session/current',
  environment.NEXT_PUBLIC_API_SITE,
).href;
const server = setupServer(
  http.delete(logoutEndpoint, () => {
    logoutRequestCount += 1;
    return new HttpResponse(null, { status: 204 });
  }),
);

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' });
});
afterAll(() => {
  server.close();
});

describe('LogoutButton', () => {
  beforeEach(() => {
    mockConfirmNavigation.mockReturnValue(true);
    logoutRequestCount = 0;
  });

  afterEach(() => {
    cleanup();
    server.resetHandlers();
    vi.clearAllMocks();
  });

  it('does not change authentication state when leave confirmation is cancelled', () => {
    mockConfirmNavigation.mockReturnValue(false);
    render(<LogoutButton />);

    fireEvent.click(screen.getByRole('button', { name: 'Log Out' }));
    expect(mockConfirmNavigation).toHaveBeenCalledTimes(1);
    expect(mockGoogleLogout).not.toHaveBeenCalled();
    expect(logoutRequestCount).toBe(0);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('runs logout once and navigates to login after confirmation', async () => {
    render(<LogoutButton />);

    fireEvent.click(screen.getByRole('button', { name: 'Log Out' }));

    await waitFor(() => {
      expect(logoutRequestCount).toBe(1);
      expect(mockReplace).toHaveBeenCalledWith('/account/login');
    });
    expect(mockConfirmNavigation).toHaveBeenCalledTimes(1);
    expect(mockGoogleLogout).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledTimes(1);
  });
});
