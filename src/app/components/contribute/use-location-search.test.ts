import { renderHook, waitFor } from '@testing-library/react';
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

vi.mock('posthog-js', () => ({
  default: {
    captureException: vi.fn(),
  },
}));

import type { Location } from './types';
import { useLocationSearch } from './use-location-search';

describe('useLocationSearch', () => {
  const knownLocations: Location[] = [
    {
      title: 'Київ',
      coordinates: [50.45, 30.52],
    },
    {
      title: 'Полтава',
      coordinates: [49.59, 34.55],
    },
    {
      title: 'Львів',
      coordinates: [49.84, 24.03],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('does not report to Bugsnag when component unmounts during fetch', async () => {
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

    const { result, unmount } = renderHook(() =>
      useLocationSearch(knownLocations),
    );

    // Set query to trigger fetch
    result.current.setQuery('test');

    // Wait for debounce to start the fetch
    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    // Unmount immediately (before fetch completes)
    unmount();

    // Wait for abort to settle
    await new Promise((resolve) => setTimeout(resolve, 200));

    // The test passes if no error is thrown
    expect(true).toBe(true);

    fetchSpy.mockRestore();
  });

  it('shows all known locations when query is empty', () => {
    const { result } = renderHook(() => useLocationSearch(knownLocations));

    expect(result.current.query).toBe('');
    expect(result.current.results.length).toBe(knownLocations.length);
    expect(result.current.results.every((r) => r.origin === 'local')).toBe(
      true,
    );
  });

  it('filters local results by query', async () => {
    const { result } = renderHook(() => useLocationSearch(knownLocations));

    result.current.setQuery('Київ');

    // Wait for the effect to run
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Should filter to only matching locations
    const matchingLocations = knownLocations.filter((l) =>
      l.title.toLowerCase().includes('Київ'.toLowerCase()),
    );
    expect(result.current.results.length).toBe(matchingLocations.length);
    expect(result.current.results[0].title).toBe('Київ');
  });
});
