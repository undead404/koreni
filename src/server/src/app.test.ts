import { describe, expect, it, vi } from 'vitest';

import { createApp } from './app.js';

vi.mock('@hono/node-server/conninfo', () => ({
  getConnInfo: vi.fn().mockReturnValue({
    remote: { address: '127.0.0.1', port: 3000 },
  }),
}));
// Mock dependencies
vi.mock('./handlers/handle-auth', () => ({
  default: vi.fn((c) => c.text('Auth Handler')),
}));

vi.mock('./handlers/handle-callback', () => ({
  default: vi.fn((c) => c.text('Callback Handler')),
}));

vi.mock('./handlers/handle-submit', () => ({
  default: vi.fn((c) => c.text('Submit Handler')),
}));

vi.mock('./middlewares/rate-limiter', () => ({
  rateLimitMiddleware: vi.fn(async (_c, next) => await next()),
}));

vi.mock('./services/posthog');

vi.mock('./environment', () => ({
  default: {
    NEXT_PUBLIC_SITE: 'https://example.com',
    PORT: 3000,
  },
}));

describe('App Factory', () => {
  it('should create an app that handles health check', async () => {
    const app = createApp();
    const response = await app.request('/api/health');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
  });

  it('should handle 404 for undefined routes', async () => {
    const app = createApp();
    const response = await app.request('/api/does-not-exist');
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Not Found' });
  });

  it('should include CORS headers', async () => {
    const app = createApp();
    const response = await app.request('/api/health', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://example.com',
        'Access-Control-Request-Method': 'GET',
      },
    });

    // Hono's cors middleware handles OPTIONS requests with 204
    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
      'https://example.com',
    );
  });

  it('should apply security headers', async () => {
    const app = createApp();
    const response = await app.request('/api/health');
    // Check for a few headers set by secureHeaders()
    expect(response.headers.get('X-Frame-Options')).toBeTruthy();
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });

  it('should route /api/submit', async () => {
    const app = createApp();
    const response = await app.request('/api/submit', {
      body: '{}',
      method: 'POST',
    });
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('Submit Handler');
  });
});
