import * as conninfo from '@hono/node-server/conninfo';
import type { Context } from 'hono';
import { describe, expect, it, vi } from 'vitest';

import getClientIdentifier from './get-client-identifier.js';

// Mock getConnInfo
vi.mock('@hono/node-server/conninfo', () => ({
  getConnInfo: vi.fn(),
}));

const mockContext = (headers: Record<string, string> = {}) =>
  ({
    req: {
      header: (name: string) => headers[name],
    },
  }) as unknown as Context;

describe('getClientIdentifier', () => {
  it('should return API key identifier if apiKey is provided', () => {
    const c = mockContext();
    const apiKey = '1234567890abcdef';
    const result = getClientIdentifier(c, apiKey);
    expect(result).toBe('api_key_12345678');
  });

  it('should return x-forwarded-for header if present', () => {
    const c = mockContext({ 'x-forwarded-for': '1.2.3.4' });
    const result = getClientIdentifier(c);
    expect(result).toBe('1.2.3.4');
  });

  it('should return remote address if x-forwarded-for is missing', () => {
    const c = mockContext();
    vi.mocked(conninfo.getConnInfo).mockReturnValue({
      remote: { address: '5.6.7.8', port: 1234 },
    });

    const result = getClientIdentifier(c);
    expect(result).toBe('5.6.7.8');
  });

  it('should return "unknown" if no identifier is found', () => {
    const c = mockContext();
    vi.mocked(conninfo.getConnInfo).mockReturnValue({
      remote: { address: undefined as unknown as string, port: 1234 },
    });

    const result = getClientIdentifier(c);
    expect(result).toBe('unknown');
  });
});
