import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { rateLimitMiddleware } from './rate-limiter.js';

const { mockConsumeIp, mockConsumeApiKey } = vi.hoisted(() => {
  return {
    mockConsumeIp: vi.fn().mockResolvedValue({}),
    mockConsumeApiKey: vi.fn().mockResolvedValue({}),
  };
});

vi.mock('rate-limiter-flexible', () => {
  return {
    RateLimiterMemory: vi.fn().mockImplementation(function (options) {
      if (options.duration === 900) {
        return {
          consume: mockConsumeIp,
        };
      }
      return {
        consume: mockConsumeApiKey,
      };
    }),
  };
});

vi.mock('@hono/node-server/conninfo', () => ({
  getConnInfo: vi.fn(() => ({
    remote: {
      address: '127.0.0.1',
    },
  })),
}));

describe('rateLimitMiddleware', () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();

    app = new Hono();
    app.use('*', rateLimitMiddleware);
    app.get('/test', (c) => c.json({ success: true }));
  });

  it('should use API key limiter and bypass IP limiter when x-api-key is present', async () => {
    const response = await app.request(
      new Request('http://localhost/test', {
        headers: {
          'x-api-key': 'test-key-123',
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(mockConsumeApiKey).toHaveBeenCalledWith('test-key-123');
    expect(mockConsumeIp).not.toHaveBeenCalled();
  });

  it('should use IP limiter with x-forwarded-for header when x-api-key is absent', async () => {
    const response = await app.request(
      new Request('http://localhost/test', {
        headers: {
          'x-forwarded-for': '203.0.113.195',
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(mockConsumeIp).toHaveBeenCalledWith('203.0.113.195');
    expect(mockConsumeApiKey).not.toHaveBeenCalled();
  });

  it('should use IP limiter with remote address fallback when both headers are absent', async () => {
    const response = await app.request(new Request('http://localhost/test'));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(mockConsumeIp).toHaveBeenCalledWith('127.0.0.1');
    expect(mockConsumeApiKey).not.toHaveBeenCalled();
  });

  it('should return 429 and halt when API key limiter rejects', async () => {
    mockConsumeApiKey.mockRejectedValueOnce(new Error('Rate Limit Exceeded'));

    const response = await app.request(
      new Request('http://localhost/test', {
        headers: {
          'x-api-key': 'test-key-123',
        },
      }),
    );

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({
      error: 'Too many requests. Please try again later.',
    });
  });

  it('should return 429 and halt when IP limiter rejects', async () => {
    mockConsumeIp.mockRejectedValueOnce(new Error('Rate Limit Exceeded'));

    const response = await app.request(new Request('http://localhost/test'));

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({
      error: 'Too many requests. Please try again later.',
    });
  });
});
