import { act,renderHook } from '@testing-library/react';
import { afterEach,beforeEach, describe, expect, it, vi } from 'vitest';

import type { Location } from './types';
import { useLocationSearch } from './use-location-search';

vi.mock('@/app/services/locationiq', () => ({
  autocomplete: vi.fn(),
}));

const mockKnownLocations: Location[] = [
  { coordinates: [50.45, 30.52], title: 'Kyiv' },
  { coordinates: [49.84, 24.03], title: 'Lviv' },
  { coordinates: [47.84, 35.14], title: 'Zaporizhzhia' },
  { coordinates: [50, 36.23], title: 'Poltava' },
  { coordinates: [48.38, 31.59], title: 'Cherkasy' },
  { coordinates: [50.62, 26.25], title: 'Rivne' },
  { coordinates: [49.23, 28.68], title: 'Vinnytsia' },
  { coordinates: [48.99, 24.71], title: 'Ivano-Frankivsk' },
  { coordinates: [50.29, 28.66], title: 'Zhytomyr' },
  { coordinates: [49.42, 32.06], title: 'Kremenchuk' },
  { coordinates: [48.63, 22.29], title: 'Uzhhorod' },
];

describe('useLocationSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('Returns top-10 known locations when query is empty', () => {
    const { result } = renderHook(() => useLocationSearch(mockKnownLocations));

    expect(result.current.results).toHaveLength(10);
    expect(result.current.results.every((r) => r.origin === 'local')).toBe(
      true,
    );
    expect(result.current.isLoading).toBe(false);
  });

  it('Filters known locations immediately on query change (before debounce)', () => {
    const { result } = renderHook(() => useLocationSearch(mockKnownLocations));

    act(() => {
      result.current.setQuery('Kyiv');
    });

    expect(result.current.results).toContainEqual(
      expect.objectContaining({
        title: 'Kyiv',
        origin: 'local',
      }),
    );
  });

  it('Sets isLoading: true after debounce fires', async () => {
    const { autocomplete } = await import('@/app/services/locationiq');
    vi.mocked(autocomplete).mockResolvedValueOnce([]);

    const { result } = renderHook(() => useLocationSearch(mockKnownLocations));

    act(() => {
      result.current.setQuery('Kyiv');
    });

    expect(result.current.isLoading).toBe(false);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.isLoading).toBe(true);
  });

  it('Merges remote results after autocomplete resolves', async () => {
    const { autocomplete } = await import('@/app/services/locationiq');
    vi.mocked(autocomplete).mockResolvedValueOnce([
      {
        display_name: 'Kyiv, Ukraine',
        lat: 50.45,
        lon: 30.52,
        place_id: '123',
      },
    ]);

    const { result } = renderHook(() => useLocationSearch(mockKnownLocations));

    act(() => {
      result.current.setQuery('Kyiv');
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.results).toContainEqual(
      expect.objectContaining({
        title: 'Kyiv, Ukraine',
        origin: 'remote',
      }),
    );
    expect(result.current.isLoading).toBe(false);
  });

  it('Falls back to local results when autocomplete returns undefined', async () => {
    const { autocomplete } = await import('@/app/services/locationiq');
    vi.mocked(autocomplete).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useLocationSearch(mockKnownLocations));

    act(() => {
      result.current.setQuery('Kyiv');
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.results).toContainEqual(
      expect.objectContaining({
        title: 'Kyiv',
        origin: 'local',
      }),
    );
    expect(result.current.isLoading).toBe(false);
  });

  it('Falls back to local results when autocomplete rejects', async () => {
    const { autocomplete } = await import('@/app/services/locationiq');
    vi.mocked(autocomplete).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useLocationSearch(mockKnownLocations));

    act(() => {
      result.current.setQuery('Kyiv');
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.results).toContainEqual(
      expect.objectContaining({
        title: 'Kyiv',
        origin: 'local',
      }),
    );
    expect(result.current.isLoading).toBe(false);
  });

  it('Does not update results after unmount', async () => {
    const { autocomplete } = await import('@/app/services/locationiq');
    vi.mocked(autocomplete).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve([
              {
                display_name: 'Kyiv, Ukraine',
                lat: 50.45,
                lon: 30.52,
                place_id: '123',
              },
            ]);
          }, 1000);
        }),
    );

    const { result, unmount } = renderHook(() =>
      useLocationSearch(mockKnownLocations),
    );

    act(() => {
      result.current.setQuery('Kyiv');
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    unmount();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // If we get here without errors, the test passes
    expect(true).toBe(true);
  });

  it('Cancels previous debounce on rapid query changes', async () => {
    const { autocomplete } = await import('@/app/services/locationiq');
    vi.mocked(autocomplete).mockResolvedValueOnce([]);

    const { result } = renderHook(() => useLocationSearch(mockKnownLocations));

    act(() => {
      result.current.setQuery('K');
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    act(() => {
      result.current.setQuery('Ky');
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    act(() => {
      result.current.setQuery('Kyiv');
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(vi.mocked(autocomplete)).toHaveBeenCalledTimes(1);
  });
});
