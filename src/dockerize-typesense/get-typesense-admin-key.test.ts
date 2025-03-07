import type { AxiosInstance } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';

import getTypesenseAdminKey from './get-typesense-admin-key';
import { typesenseKeysPostResponseSchema } from './schemata';
import writeEnvironmentValues from './write-environment-values';

vi.mock('./write-environment-values');

describe('getTypesenseAdminKey', () => {
  const mockClient = {
    post: vi.fn(),
  };

  const mockClientAsClient = mockClient as unknown as AxiosInstance;

  const apiKey = 'test-api-key';

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return existing admin key if not in bootstrap mode and key exists in env', async () => {
    const existingAdminKey = 'existing-admin-key';
    process.env.TYPESENSE_ADMIN_KEY = existingAdminKey;

    const result = await getTypesenseAdminKey(
      mockClientAsClient,
      apiKey,
      false,
    );

    expect(result).toBe(existingAdminKey);
    expect(mockClient.post).not.toHaveBeenCalled();
    expect(writeEnvironmentValues).not.toHaveBeenCalled();

    delete process.env.TYPESENSE_ADMIN_KEY;
  });

  it('should create a new admin key if in bootstrap mode', async () => {
    const newAdminKey = 'new-admin-key';
    const mockResponse = {
      data: {
        value: newAdminKey,
      },
    };

    mockClient.post.mockResolvedValueOnce(mockResponse);
    vi.spyOn(typesenseKeysPostResponseSchema, 'parse').mockReturnValue(
      mockResponse,
    );

    const result = await getTypesenseAdminKey(mockClientAsClient, apiKey, true);

    expect(result).toBe(newAdminKey);
    expect(mockClient.post).toHaveBeenCalledWith(
      '/keys',
      {
        description: 'Admin key',
        actions: ['*'],
        collections: ['*'],
      },
      {
        headers: { 'X-TYPESENSE-API-KEY': apiKey },
      },
    );
    expect(writeEnvironmentValues).toHaveBeenCalledWith({
      TYPESENSE_ADMIN_KEY: newAdminKey,
    });
  });

  it('should create a new admin key if not in bootstrap mode and no key in env', async () => {
    const newAdminKey = 'new-admin-key';
    const mockResponse = {
      data: {
        value: newAdminKey,
      },
    };

    mockClient.post.mockResolvedValueOnce(mockResponse);
    vi.spyOn(typesenseKeysPostResponseSchema, 'parse').mockReturnValue(
      mockResponse,
    );

    const result = await getTypesenseAdminKey(
      mockClientAsClient,
      apiKey,
      false,
    );

    expect(result).toBe(newAdminKey);
    expect(mockClient.post).toHaveBeenCalledWith(
      '/keys',
      {
        description: 'Admin key',
        actions: ['*'],
        collections: ['*'],
      },
      {
        headers: { 'X-TYPESENSE-API-KEY': apiKey },
      },
    );
    expect(writeEnvironmentValues).toHaveBeenCalledWith({
      TYPESENSE_ADMIN_KEY: newAdminKey,
    });
  });
});
