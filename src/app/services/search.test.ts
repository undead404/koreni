import type { Client } from 'typesense';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { SearchResultRow } from '../schemas/search-result';

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
    // const mockHitsPl: SearchResultRow[] = [
    //   {
    //     document: {
    //       id: '1',
    //       tableId: 'valid-id',
    //       title: 'Document 1',
    //       year: 1821,
    //     },
    //     highlight: {},
    //     text_match_info: { best_field_score: '1' },
    //   },
    // ];
    const mockHitsRu: SearchResultRow[] = [
      {
        document: {
          id: '1',
          tableId: 'valid-id',
          title: 'Document 1',
          year: 1821,
        },
        highlight: {},
        text_match_info: { best_field_score: '1' },
      },
    ];
    const mockHitsUk: SearchResultRow[] = [
      {
        document: {
          id: '2',
          tableId: 'valid-id',
          title: 'Document 2',
          year: 1836,
        },
        highlight: {},
        text_match_info: { best_field_score: '2' },
      },
    ];

    mockClient.search
      // .mockResolvedValueOnce(mockSearchResult(mockHitsPl, 1))
      .mockResolvedValueOnce(mockSearchResult(mockHitsRu, 1))
      .mockResolvedValueOnce(mockSearchResult(mockHitsUk, 1));

    const parameters: SearchParameters = {
      client: mockClient as unknown as Client,
      query: 'test',
    };

    const [results, total] = await search(parameters);

    expect(results).toHaveLength(/*3*/ 2);
    expect(results[0].document.id).toBe('2'); // Sorted by best_field_score
    expect(results[1].document.id).toBe('1');
    expect(total).toBe(/*3*/ 2);

    // expect(mockClient.collections).toHaveBeenCalledWith('unstructured_pl');
    expect(mockClient.collections).toHaveBeenCalledWith('unstructured_ru');
    expect(mockClient.collections).toHaveBeenCalledWith('unstructured_uk');
    expect(mockClient.search).toHaveBeenCalledTimes(/*3*/ 2);
  });

  it('should throw rejection from the first collection', async () => {
    const mockHitsUk: SearchResultRow[] = [
      {
        document: {
          id: '2',
          tableId: 'valid-id',
          title: 'Document 2',
          year: 1858,
        },
        highlight: {},
        text_match_info: { best_field_score: '2' },
      },
    ];

    mockClient.search
      .mockRejectedValueOnce(new Error('Search failed'))
      .mockResolvedValueOnce(mockSearchResult(mockHitsUk, 1));

    const parameters: SearchParameters = {
      client: mockClient as unknown as Client,
      query: 'test',
    };

    await expect(search(parameters)).rejects.toThrow('Search failed');
  });

  it('should throw rejection from the second collection', async () => {
    const mockHitsRu: SearchResultRow[] = [
      {
        document: {
          id: '2',
          tableId: 'valid-id',
          title: 'Document 2',
          year: 1858,
        },
        highlight: {},
        text_match_info: { best_field_score: '2' },
      },
    ];

    mockClient.search
      .mockResolvedValueOnce(mockSearchResult(mockHitsRu, 1))
      .mockRejectedValueOnce(new Error('Search failed'));

    const parameters: SearchParameters = {
      client: mockClient as unknown as Client,
      query: 'test',
    };

    await expect(search(parameters)).rejects.toThrow('Search failed');
  });

  it('should throw an error if both collections reject', async () => {
    mockClient.search
      .mockRejectedValueOnce(new Error('Search failed'))
      .mockRejectedValueOnce(new Error('Search failed'));

    const parameters: SearchParameters = {
      client: mockClient as unknown as Client,
      query: 'test',
    };

    await expect(search(parameters)).rejects.toThrow(
      'Search failed in one or more languages',
    );

    // expect(mockClient.collections).toHaveBeenCalledWith('unstructured_pl');
    expect(mockClient.collections).toHaveBeenCalledWith('unstructured_ru');
    expect(mockClient.collections).toHaveBeenCalledWith('unstructured_uk');
    expect(mockClient.search).toHaveBeenCalledTimes(/*3*/ 2);
  });
});
