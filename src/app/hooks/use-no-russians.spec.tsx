import { renderHook, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import useNoRussians from './use-no-russians';

// Mocks
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
  useRouter: vi.fn(),
}));

describe('useNoRussians', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
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
    renderHook(() => {
      useNoRussians();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should redirect if html lang is "ru"', async () => {
    document.documentElement.setAttribute('lang', 'ru');

    renderHook(() => {
      useNoRussians();
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/not-welcome');
    });
  });

  it('should redirect if html lang contains "ru" (e.g. ru-RU)', async () => {
    document.documentElement.setAttribute('lang', 'ru-RU');

    renderHook(() => {
      useNoRussians();
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/not-welcome');
    });
  });

  it('should redirect if primary navigator language is "ru"', async () => {
    Object.defineProperty(navigator, 'languages', {
      value: ['ru', 'en'],
      configurable: true,
    });

    renderHook(() => {
      useNoRussians();
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/not-welcome');
    });
  });

  it('should do nothing if Russian is a secondary language', () => {
    Object.defineProperty(navigator, 'languages', {
      value: ['en', 'ru'],
      configurable: true,
    });

    renderHook(() => {
      useNoRussians();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });
});
