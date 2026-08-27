import type { PostHog } from 'posthog-js';
import type { Client } from 'typesense';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { SearchResultRow } from '../schemas/search-result';

import search, { type SearchParameters } from './search';

const mockClient = {
  multiSearch: {
    perform: vi.fn(),
  },
};

const mockPosthog = {
  capture: vi.fn(),
};

const mockSearchResult = (hits: SearchResultRow[], found: number) => ({
  hits,
  found,
});

describe('search', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });
  it('should return combined and sorted search results from both collections', async () => {
    const mockHits: SearchResultRow[] = [
      {
        document: {
          id: '1',
          raw: {},
          tableId: 'valid-id',
          title: 'Document 1',
          year: 1821,
        },
        highlight: {},
        text_match_info: { typo_prefix_score: 1 },
      },
      {
        document: {
          id: '2',
          raw: {},
          tableId: 'valid-id',
          title: 'Document 2',
          year: 1836,
        },
        highlight: {},
        text_match_info: { typo_prefix_score: 2 },
      },
    ];

    mockClient.multiSearch.perform.mockResolvedValueOnce(
      mockSearchResult(mockHits, 2),
    );

    const parameters: SearchParameters = {
      client: mockClient as unknown as Client,
      query: 'test',
    };

    const [results, total] = await search(parameters);

    expect(results).toHaveLength(2);
    expect(total).toBe(2);

    expect(mockClient.multiSearch.perform).toHaveBeenCalledWith(
      {
        searches: [
          {
            collection: 'unstructured_pl',
            q: 'test',
          },
          {
            collection: 'unstructured_ru',
            q: 'тест',
          },
          {
            collection: 'unstructured_uk',
            q: 'тест',
          },
        ],
        union: true,
      },
      {
        drop_tokens_threshold: 0,
        num_typos: 2,
        page: 1,
        per_page: 24,
        query_by: 'values',
        sort_by: '_text_match:desc,year:desc',
      },
    );
  });

  it('should throw rejection', async () => {
    mockClient.multiSearch.perform.mockRejectedValueOnce(
      new Error('Search failed'),
    );

    const parameters: SearchParameters = {
      client: mockClient as unknown as Client,
      query: 'test',
    };

    await expect(search(parameters)).rejects.toThrow('Search failed');
  });

  it('should capture a PostHog event when a paginated page returns empty hits despite a non-zero found count', async () => {
    mockClient.multiSearch.perform.mockResolvedValueOnce(
      mockSearchResult([], 480),
    );

    const parameters: SearchParameters = {
      client: mockClient as unknown as Client,
      page: 13,
      perPage: 24,
      posthog: mockPosthog as unknown as PostHog,
      query: 'Мельник',
      yearFrom: '1800',
      yearTo: '1900',
    };

    const [results, total] = await search(parameters);

    expect(results).toStrictEqual([]);
    expect(total).toStrictEqual(480);
    expect(mockPosthog.capture).toHaveBeenCalledExactlyOnceWith(
      'search_empty_page',
      {
        page: 13,
        per_page: 24,
        total_found: 480,
        query: 'Мельник',
        year_from: '1800',
        year_to: '1900',
      },
    );
  });

  it('should NOT capture a PostHog event when page 1 returns empty hits', async () => {
    mockClient.multiSearch.perform.mockResolvedValueOnce(
      mockSearchResult([], 0),
    );

    const parameters: SearchParameters = {
      client: mockClient as unknown as Client,
      page: 1,
      posthog: mockPosthog as unknown as PostHog,
      query: 'test',
    };

    await search(parameters);

    expect(mockPosthog.capture).not.toHaveBeenCalled();
  });

  it('should NOT capture a PostHog event when a later page returns hits normally', async () => {
    const mockHits: SearchResultRow[] = [
      {
        document: {
          id: '1',
          raw: {},
          tableId: 'valid-id',
          title: 'Document 1',
          year: 1821,
        },
        highlight: {},
        text_match_info: { typo_prefix_score: 1 },
      },
    ];

    mockClient.multiSearch.perform.mockResolvedValueOnce(
      mockSearchResult(mockHits, 480),
    );

    const parameters: SearchParameters = {
      client: mockClient as unknown as Client,
      page: 5,
      posthog: mockPosthog as unknown as PostHog,
      query: 'test',
    };

    await search(parameters);

    expect(mockPosthog.capture).not.toHaveBeenCalled();
  });

  it('should NOT capture a PostHog event when posthog is not provided', async () => {
    mockClient.multiSearch.perform.mockResolvedValueOnce(
      mockSearchResult([], 480),
    );

    const parameters: SearchParameters = {
      client: mockClient as unknown as Client,
      page: 13,
      query: 'test',
    };

    const [results, total] = await search(parameters);

    expect(results).toStrictEqual([]);
    expect(total).toStrictEqual(480);
    expect(mockPosthog.capture).not.toHaveBeenCalled();
  });
});
