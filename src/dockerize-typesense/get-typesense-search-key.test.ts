import type { AxiosInstance } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import getTypesenseSearchKey from './get-typesense-search-key';
import { typesenseKeysPostResponseSchema } from './schemata';
import writeEnvironmentValues from './write-environment-values';

vi.mock('./write-environment-values');

describe('getTypesenseSearchKey', () => {
  const mockClient = {
    post: vi.fn(),
  };

  const mockClientAsClient = mockClient as unknown as AxiosInstance;

  const apiKey = 'test-api-key';

  const originalEnvironment = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnvironment };
  });

  afterEach(() => {
    vi.clearAllMocks();
    process.env = originalEnvironment;
  });

  it('should return existing search key if it exists and not in bootstrap mode', async () => {
    const existingSearchKey = 'existing-search-key';
    process.env.TYPESENSE_SEARCH_KEY = existingSearchKey;

    const result = await getTypesenseSearchKey(
      mockClientAsClient,
      apiKey,
      false,
    );

    expect(result).toBe(existingSearchKey);
    expect(mockClient.post).not.toHaveBeenCalled();
    expect(writeEnvironmentValues).not.toHaveBeenCalled();
  });

  it('should create a new search key if in bootstrap mode', async () => {
    const newSearchKey = 'new-search-key';
    const mockResponse = {
      data: {
        value: newSearchKey,
      },
    };

    mockClient.post.mockResolvedValueOnce(mockResponse);
    vi.spyOn(typesenseKeysPostResponseSchema, 'parse').mockReturnValue(
      mockResponse,
    );

    const result = await getTypesenseSearchKey(
      mockClientAsClient,
      apiKey,
      true,
    );

    expect(result).toBe(newSearchKey);
    expect(mockClient.post).toHaveBeenCalledWith(
      '/keys',
      {
        description: 'Search key',
        actions: ['documents:search'],
        collections: ['*'],
      },
      {
        headers: { 'X-TYPESENSE-API-KEY': apiKey },
      },
    );
    expect(writeEnvironmentValues).toHaveBeenCalledWith({
      NEXT_PUBLIC_TYPESENSE_SEARCH_KEY: newSearchKey,
    });
  });

  it('should create a new search key if not in bootstrap mode and no key in env', async () => {
    const newSearchKey = 'new-search-key';
    const mockResponse = {
      data: {
        value: newSearchKey,
      },
    };

    mockClient.post.mockResolvedValueOnce(mockResponse);
    vi.spyOn(typesenseKeysPostResponseSchema, 'parse').mockReturnValue(
      mockResponse,
    );

    const result = await getTypesenseSearchKey(
      mockClientAsClient,
      apiKey,
      false,
    );

    expect(result).toBe(newSearchKey);
    expect(mockClient.post).toHaveBeenCalledWith(
      '/keys',
      {
        description: 'Search key',
        actions: ['documents:search'],
        collections: ['*'],
      },
      {
        headers: { 'X-TYPESENSE-API-KEY': apiKey },
      },
    );
    expect(writeEnvironmentValues).toHaveBeenCalledWith({
      NEXT_PUBLIC_TYPESENSE_SEARCH_KEY: newSearchKey,
    });
  });
});
