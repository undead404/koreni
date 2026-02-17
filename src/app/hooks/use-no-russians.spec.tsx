import { renderHook, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import useNoRussians from './use-no-russians';

// Mocks
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
  useRouter: vi.fn(),
}));

vi.mock('posthog-js', () => ({
  default: {
    captureException: vi.fn(),
  },
}));

vi.mock('../services/bugsnag', () => ({
  initBugsnag: vi.fn().mockReturnValue({ notify: vi.fn() }),
}));

// Mock sonner specifically to intercept toast calls
const mockToastError = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    error: (...arguments_: unknown[]) => mockToastError(...arguments_),
  },
}));

describe('useNoRussians', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any);

    // Reset document lang
    document.documentElement.setAttribute('lang', 'uk');

    // Reset navigator languages
    Object.defineProperty(navigator, 'languages', {
      value: ['uk', 'en'],
      configurable: true,
    });
  });

  it('should not redirect or show toast for Ukrainian users', () => {
    renderHook(() => useNoRussians());

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it('should redirect if html lang is "ru"', async () => {
    document.documentElement.setAttribute('lang', 'ru');

    renderHook(() => useNoRussians());

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/not-welcome');
    });
  });

  it('should redirect if html lang contains "ru" (e.g. ru-RU)', async () => {
    document.documentElement.setAttribute('lang', 'ru-RU');

    renderHook(() => useNoRussians());

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/not-welcome');
    });
  });

  it('should redirect if primary navigator language is "ru"', async () => {
    Object.defineProperty(navigator, 'languages', {
      value: ['ru', 'en'],
      configurable: true,
    });

    renderHook(() => useNoRussians());

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/not-welcome');
    });
  });

  it('should show "Light Ukrainization" toast if "ru" is secondary language', async () => {
    Object.defineProperty(navigator, 'languages', {
      value: ['en', 'ru'],
      configurable: true,
    });

    renderHook(() => useNoRussians());

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalled();
      expect(mockToastError.mock.calls[0][0]).toBe('Лагідна українізація!');
    });

    expect(mockPush).not.toHaveBeenCalled();
  });
});
