import type { Client } from 'typesense';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { SearchResultRow } from '../schemas/search-result';

import search, { type SearchParameters } from './search';

const mockClient = {
  multiSearch: {
    perform: vi.fn(),
  },
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
        num_typos: 2,
        page: 1,
        per_page: 24,
        query_by: 'values',
        sort_by: '_text_match:desc,year:desc',
      },
    );
  });

  it('should throw rejection', async () => {
    const mockHits: SearchResultRow[] = [
      {
        document: {
          id: '2',
          raw: {},
          tableId: 'valid-id',
          title: 'Document 2',
          year: 1858,
        },
        highlight: {},
        text_match_info: { typo_prefix_score: 2 },
      },
    ];

    mockClient.multiSearch.perform
      .mockRejectedValueOnce(new Error('Search failed'))
      .mockResolvedValueOnce(mockSearchResult(mockHits, 1));

    const parameters: SearchParameters = {
      client: mockClient as unknown as Client,
      query: 'test',
    };

    await expect(search(parameters)).rejects.toThrow('Search failed');
  });
});
