import { Client } from 'typesense';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SearchResultRow } from '../schemas/search-result';

import search, { type SearchParameters } from './search';

const mockClient = {
  collections: vi.fn().mockReturnThis(),
  documents: vi.fn().mockReturnThis(),
  search: vi.fn(),
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
    const mockHitsRu: SearchResultRow[] = [
      {
        document: { id: '1', tableId: 1, title: 'Document 1' },
        highlight: {},
        text_match_info: { best_field_score: '1' },
      },
    ];
    const mockHitsUk: SearchResultRow[] = [
      {
        document: { id: '2', tableId: 2, title: 'Document 2' },
        highlight: {},
        text_match_info: { best_field_score: '2' },
      },
    ];

    (mockClient.search as vi.Mock)
      .mockResolvedValueOnce(mockSearchResult(mockHitsRu, 1))
      .mockResolvedValueOnce(mockSearchResult(mockHitsUk, 1));

    const parameters: SearchParameters = {
      client: mockClient as unknown as Client,
      query: 'test',
    };

    const [results, total] = await search(parameters);

    expect(results).toHaveLength(2);
    expect(results[0].document.id).toBe('2'); // Sorted by best_field_score
    expect(results[1].document.id).toBe('1');
    expect(total).toBe(2);

    expect(mockClient.collections).toHaveBeenCalledWith('unstructured_ru');
    expect(mockClient.collections).toHaveBeenCalledWith('unstructured_uk');
    expect(mockClient.search).toHaveBeenCalledTimes(2);
  });

  it('should handle rejection from one collection and return results from the other', async () => {
    const mockHitsUk: SearchResultRow[] = [
      {
        document: { id: '2', tableId: 2, title: 'Document 2' },
        highlight: {},
        text_match_info: { best_field_score: '2' },
      },
    ];

    (mockClient.search as vi.Mock)
      .mockRejectedValueOnce(new Error('Search failed'))
      .mockResolvedValueOnce(mockSearchResult(mockHitsUk, 1));

    const parameters: SearchParameters = {
      client: mockClient as unknown as Client,
      query: 'test',
    };

    const [results, total] = await search(parameters);

    expect(results).toHaveLength(1);
    expect(results[0].document.id).toBe('2');
    expect(total).toBe(1);

    expect(mockClient.collections).toHaveBeenCalledWith('unstructured_ru');
    expect(mockClient.collections).toHaveBeenCalledWith('unstructured_uk');
    expect(mockClient.search).toHaveBeenCalledTimes(2);
  });

  it('should throw an error if both collections reject', async () => {
    (mockClient.search as vi.Mock)
      .mockRejectedValueOnce(new Error('Search failed'))
      .mockRejectedValueOnce(new Error('Search failed'));

    const parameters: SearchParameters = {
      client: mockClient as unknown as Client,
      query: 'test',
    };

    await expect(search(parameters)).rejects.toThrow(
      'Search failed in both languages',
    );

    expect(mockClient.collections).toHaveBeenCalledWith('unstructured_ru');
    expect(mockClient.collections).toHaveBeenCalledWith('unstructured_uk');
    expect(mockClient.search).toHaveBeenCalledTimes(2);
  });
});
