import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';

import { logger } from '../logger.js';

import { requestLoggingMiddleware } from './request-logging.js';

vi.mock('../logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn() },
}));

describe('request logging middleware', () => {
  it('adds a request id and logs the completed response', async () => {
    const app = new Hono();
    app.use('*', requestLoggingMiddleware);
    app.get('/health', (c) => c.json({ status: 'ok' }));

    const response = await app.request('/health');

    expect(response.status).toBe(200);
    expect(response.headers.get('X-Request-Id')).toMatch(/^[0-9a-f-]{36}$/);
    expect(logger.info).toHaveBeenCalledWith(
      'request.completed',
      expect.objectContaining({ method: 'GET', path: '/health', status: 200 }),
    );
  });

  it('rejects malformed incoming request ids', async () => {
    const app = new Hono();
    app.use('*', requestLoggingMiddleware);
    app.get('/health', (c) => c.json({ status: 'ok' }));

    const response = await app.request('/health', {
      headers: { 'X-Request-Id': 'bad value' },
    });

    expect(response.headers.get('X-Request-Id')).not.toBe('bad value');
    expect(response.headers.get('X-Request-Id')).toMatch(/^[0-9a-f-]{36}$/);
  });
});
