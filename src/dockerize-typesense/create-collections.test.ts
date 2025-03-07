import type { AxiosInstance } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  RU_COLLECTION_CONFIGURATION,
  UK_COLLECTION_CONFIGURATION,
} from './config';
import createCollections from './create-collections';

describe('createCollections', () => {
  const mockClient = {
    post: vi.fn(),
  };

  const mockClientAsClient = mockClient as unknown as AxiosInstance;

  const apiKey = 'test-api-key';

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create RU and UK collections successfully', async () => {
    mockClient.post.mockResolvedValueOnce({ status: 201 });
    mockClient.post.mockResolvedValueOnce({ status: 201 });

    await createCollections(mockClientAsClient, apiKey);

    expect(mockClient.post).toHaveBeenCalledWith(
      '/collections',
      RU_COLLECTION_CONFIGURATION,
      {
        headers: { 'X-TYPESENSE-API-KEY': apiKey },
      },
    );
    expect(mockClient.post).toHaveBeenCalledWith(
      '/collections',
      UK_COLLECTION_CONFIGURATION,
      {
        headers: { 'X-TYPESENSE-API-KEY': apiKey },
      },
    );
  });

  it('should handle RU collection already exists error', async () => {
    mockClient.post.mockRejectedValueOnce({ status: 409 });
    mockClient.post.mockResolvedValueOnce({ status: 201 });

    const consoleLogSpy = vi.spyOn(console, 'log');

    await createCollections(mockClientAsClient, apiKey);

    expect(mockClient.post).toHaveBeenCalledWith(
      '/collections',
      RU_COLLECTION_CONFIGURATION,
      {
        headers: { 'X-TYPESENSE-API-KEY': apiKey },
      },
    );
    expect(mockClient.post).toHaveBeenCalledWith(
      '/collections',
      UK_COLLECTION_CONFIGURATION,
      {
        headers: { 'X-TYPESENSE-API-KEY': apiKey },
      },
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Collection unstructured_ru already exists',
    );
  });

  it('should handle UK collection already exists error', async () => {
    mockClient.post.mockResolvedValueOnce({ status: 201 });
    mockClient.post.mockRejectedValueOnce({ status: 409 });

    const consoleLogSpy = vi.spyOn(console, 'log');

    await createCollections(mockClientAsClient, apiKey);

    expect(mockClient.post).toHaveBeenCalledWith(
      '/collections',
      RU_COLLECTION_CONFIGURATION,
      {
        headers: { 'X-TYPESENSE-API-KEY': apiKey },
      },
    );
    expect(mockClient.post).toHaveBeenCalledWith(
      '/collections',
      UK_COLLECTION_CONFIGURATION,
      {
        headers: { 'X-TYPESENSE-API-KEY': apiKey },
      },
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Collection unstructured_uk already exists',
    );
  });

  it('should throw an error for non-409 errors', async () => {
    const error = new Error('Server error');

    (error as any).status = 500;
    mockClient.post.mockRejectedValueOnce(error);
    mockClient.post.mockResolvedValueOnce({ status: 201 });

    await expect(createCollections(mockClientAsClient, apiKey)).rejects.toThrow(
      error as unknown as Error,
    );

    expect(mockClient.post).toHaveBeenCalledWith(
      '/collections',
      RU_COLLECTION_CONFIGURATION,
      {
        headers: { 'X-TYPESENSE-API-KEY': apiKey },
      },
    );
  });
});
