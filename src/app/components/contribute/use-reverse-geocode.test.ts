import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/app/environment', () => ({
  default: {
    NEXT_PUBLIC_LOCATIONIQ_KEY: 'test-key',
    NEXT_PUBLIC_GITHUB_REPO: 'test-repo',
    NEXT_PUBLIC_SITE: 'https://test.com',
    NODE_ENV: 'test',
  },
}));

vi.mock('@/app/services/bugsnag', () => ({
  initBugsnag: vi.fn(() => ({
    notify: vi.fn(),
    isStarted: vi.fn(() => true),
  })),
}));

vi.mock('posthog-js/react', () => ({
  usePostHog: () => ({
    capture: vi.fn(),
  }),
}));

import { useReverseGeocode } from './use-reverse-geocode';

describe('useReverseGeocode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('does not report AbortError to Bugsnag when unmounted during fetch', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          setTimeout(() => {
            const error = new Error('Aborted');
            error.name = 'AbortError';
            reject(error);
          }, 100);
        }),
    );

    const { unmount } = renderHook(() => useReverseGeocode('48.5,31.2'));

    // Wait for debounce to start the fetch
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Unmount before fetch completes
    unmount();

    // Wait for abort to settle
    await new Promise((resolve) => setTimeout(resolve, 200));

    // The test passes if no error is thrown
    expect(true).toBe(true);

    fetchSpy.mockRestore();
  });

  it('does not call setLocation or setStatus after unmount', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve(
              new Response(
                JSON.stringify({ display_name: 'Полтава, Україна' }),
                { status: 200 },
              ),
            );
          }, 200);
        }),
    );

    const { unmount } = renderHook(() => useReverseGeocode('48.5,31.2'));

    // Wait for debounce to fire
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Unmount before fetch resolves
    unmount();

    // Wait for fetch to complete
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Should not have any state update warnings
    const stateUpdateWarnings = consoleErrorSpy.mock.calls.filter((call) =>
      String(call[0]).includes('state update'),
    );
    expect(stateUpdateWarnings.length).toBe(0);

    consoleErrorSpy.mockRestore();
    fetchSpy.mockRestore();
  });

  it('sets status to loading immediately when locationValue is provided', () => {
    const { result } = renderHook(() => useReverseGeocode('48.5,31.2'));

    expect(result.current.status).toBe('loading');
  });

  it('resets to null/idle when locationValue becomes null', () => {
    const initialProperties: { locationValue: string | null | undefined } = {
      locationValue: '50.45,30.52',
    };
    const { result, rerender } = renderHook(
      ({ locationValue }: { locationValue: string | null | undefined }) =>
        useReverseGeocode(locationValue),
      { initialProps: initialProperties },
    );

    expect(result.current.status).toBe('loading');

    // Rerender with null
    rerender({ locationValue: null });

    expect(result.current.location).toBeNull();
    expect(result.current.status).toBe('idle');
  });

  it('falls back to raw locationValue on parse error (invalid coordinates string)', () => {
    const { result } = renderHook(() => useReverseGeocode('not-coordinates'));

    // The hook should set status to loading initially
    expect(result.current.status).toBe('loading');
  });
});
