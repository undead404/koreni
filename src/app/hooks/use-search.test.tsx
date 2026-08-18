import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { SearchResult } from '../services/search';

const mocks = vi.hoisted(() => ({
  capture: vi.fn(),
  captureException: vi.fn(),
}));

vi.mock('../environment', () => ({
  default: {
    NEXT_PUBLIC_TYPESENSE_SEARCH_KEY: 'test-key',
    NEXT_PUBLIC_TYPESENSE_HOST: 'localhost:8108',
  },
}));

vi.mock('posthog-js/react', () => ({
  usePostHog: () => mocks,
}));

vi.mock('../services/typesense', () => ({
  default: vi.fn(),
}));

vi.mock('../services/search', () => ({
  default: vi.fn(),
}));

vi.mock('../services/bugsnag', () => ({
  initBugsnag: () => ({
    notify: vi.fn(),
  }),
}));

import { useSearch } from './use-search';

const searchModule = await import('../services/search');
const mockSearch = vi.mocked(searchModule.default);

describe('useSearch', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('sets resultsNumber to the corrected ceiling when a page > 1 returns empty hits with non-zero found', async () => {
    mockSearch.mockResolvedValueOnce([[], 480]);

    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.handleSearch('Мельник', '', '', 13);
    });

    expect(result.current.results).toStrictEqual([]);
    expect(result.current.resultsNumber).toStrictEqual(12 * 24); // (page - 1) * PER_PAGE = 12 * 24 = 288
  });

  it('sets resultsNumber to hitsNumber normally when hits are present on page > 1', async () => {
    const mockHit: SearchResult = {
      document: {
        id: '1',
        raw: {},
        tableId: 'valid-id',
        title: 'Document 1',
        year: 1821,
      },
      highlight: {},
      text_match: 100,
      text_match_info: {
        best_field_score: '100',
        best_field_weight: 1,
        fields_matched: 1,
        score: '100',
        tokens_matched: 1,
      },
    };

    mockSearch.mockResolvedValueOnce([[mockHit], 480]);

    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.handleSearch('test', '', '', 5);
    });

    expect(result.current.resultsNumber).toStrictEqual(480);
  });

  it('sets resultsNumber to 0 when page 1 returns empty hits', async () => {
    mockSearch.mockResolvedValueOnce([[], 0]);

    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.handleSearch('test', '', '', 1);
    });

    expect(result.current.resultsNumber).toStrictEqual(0);
  });

  it('sets resultsNumber to hitsNumber when page 1 returns empty hits but found > 0', async () => {
    mockSearch.mockResolvedValueOnce([[], 100]);

    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.handleSearch('test', '', '', 1);
    });

    // Page 1 with empty hits should NOT trigger correction, even if found > 0
    expect(result.current.resultsNumber).toStrictEqual(100);
  });

  it('clears results when query is empty', async () => {
    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.handleSearch('', '', '', 1);
    });

    expect(result.current.results).toStrictEqual([]);
    expect(result.current.resultsNumber).toStrictEqual(0);
    expect(result.current.isLoading).toBe(false);
  });

  it('captures search_performed event', async () => {
    mockSearch.mockResolvedValueOnce([[], 0]);

    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.handleSearch('Мельник', '1800', '1900', 1);
    });

    expect(mocks.capture).toHaveBeenCalledWith('search_performed', {
      query: 'Мельник',
      query_length: 7,
      year_from: '1800',
      year_to: '1900',
    });
  });

  it('captures search_results_returned event', async () => {
    mockSearch.mockResolvedValueOnce([[], 42]);

    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.handleSearch('test', '', '', 1);
    });

    expect(mocks.capture).toHaveBeenCalledWith('search_results_returned', {
      query: 'test',
      results_count: 42,
      year_from: '',
      year_to: '',
    });
  });

  it('handles search errors gracefully', async () => {
    mockSearch.mockRejectedValueOnce(new Error('Search failed'));

    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.handleSearch('test', '', '', 1);
    });

    expect(result.current.error).toBe(
      'Під час пошуку сталася помилка. Будь ласка, спробуйте ще.',
    );
    expect(result.current.isLoading).toBe(false);
  });
});
