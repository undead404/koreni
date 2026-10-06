import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createApp } from './app.js';

const environment = vi.hoisted(
  (): {
    BUILD_REVISION: string | undefined;
    EMAIL_VISIBILITY_SYNC_TOKEN: string | undefined;
    NEXT_PUBLIC_SITE: string;
    PORT: number;
  } => ({
    BUILD_REVISION: 'test-revision',
    EMAIL_VISIBILITY_SYNC_TOKEN: 'policy-token',
    NEXT_PUBLIC_SITE: 'https://example.com',
    PORT: 3000,
  }),
);
const getKarmaStatsMetadata = vi.hoisted(() => vi.fn());
const reportError = vi.hoisted(() => vi.fn());

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

vi.mock('./services/karma-source.js', () => ({
  getKarmaStatsMetadata,
}));

vi.mock('./services/bugsnag.js', () => ({
  bugsnagMiddleware: undefined,
  reportError,
}));

vi.mock('./database/get-email-visibility-suppressions.js', () => ({
  default: vi.fn().mockResolvedValue(['suppressed@example.com']),
}));

vi.mock('./database/client', () => ({
  default: {},
}));

vi.mock('./environment.js', () => ({
  default: environment,
}));

describe('App Factory', () => {
  beforeEach(() => {
    environment.BUILD_REVISION = 'test-revision';
    environment.EMAIL_VISIBILITY_SYNC_TOKEN = 'policy-token';
    getKarmaStatsMetadata.mockReset();
    getKarmaStatsMetadata.mockResolvedValue({
      generatedAt: '2026-08-24T18:00:00.000Z',
      revision: 'test-index-revision',
      version: 1,
    });
    reportError.mockReset();
  });

  it('should create an app that handles health check', async () => {
    const app = createApp();
    const response = await app.request('/api/health');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      build_revision: 'test-revision',
      generated_at: '2026-08-24T18:00:00.000Z',
      index_revision: 'test-index-revision',
      index_version: 1,
      status: 'ok',
    });
    expect(getKarmaStatsMetadata).toHaveBeenCalledOnce();
  });

  it('should return blank statistics when the index is unavailable', async () => {
    getKarmaStatsMetadata.mockRejectedValue(new Error('index unavailable'));
    const app = createApp();

    const response = await app.request('/api/health');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      build_revision: 'test-revision',
      generated_at: null,
      index_revision: null,
      index_version: null,
      status: 'ok',
    });
    expect(reportError).toHaveBeenCalledOnce();
  });

  it('should return blank health metadata without a build revision', async () => {
    environment.BUILD_REVISION = undefined;
    const app = createApp();

    const response = await app.request('/api/health');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      build_revision: null,
      generated_at: null,
      index_revision: null,
      index_version: null,
      status: 'ok',
    });
    expect(getKarmaStatsMetadata).not.toHaveBeenCalled();
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

  it('registers authenticated email visibility routes and rejects anonymous access', async () => {
    const app = createApp();

    const visibilityGetResponse = await app.request(
      '/api/auth/email-visibility',
    );
    const putResponse = await app.request('/api/auth/email-visibility', {
      body: JSON.stringify({ show_email: false }),
      headers: { 'Content-Type': 'application/json' },
      method: 'PUT',
    });

    expect(visibilityGetResponse.status).toBe(401);
    expect(putResponse.status).toBe(401);
  });

  it('registers the private email visibility policy endpoint', async () => {
    const app = createApp();
    const denied = await app.request('/api/internal/email-visibility-policy');
    const allowed = await app.request('/api/internal/email-visibility-policy', {
      headers: { Authorization: 'Bearer policy-token' },
    });

    expect(denied.status).toBe(401);
    expect(allowed.status).toBe(200);
    expect(await allowed.json()).toStrictEqual({
      suppressed_emails: ['suppressed@example.com'],
    });
  });
});
