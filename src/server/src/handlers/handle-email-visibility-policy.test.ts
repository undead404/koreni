import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import handleEmailVisibilityPolicy from './handle-email-visibility-policy.js';

const mocks = vi.hoisted(() => ({
  getSuppressions: vi.fn(),
  loggerError: vi.fn(),
  token: 'policy-secret',
}));

vi.mock('../database/get-email-visibility-suppressions.js', () => ({
  default: mocks.getSuppressions,
}));
vi.mock('../environment.js', () => ({
  default: {
    get EMAIL_VISIBILITY_SYNC_TOKEN() {
      return mocks.token;
    },
  },
}));
vi.mock('../logger.js', () => ({
  logger: { error: mocks.loggerError },
}));

function createApp() {
  const app = new Hono();
  app.get('/api/internal/email-visibility-policy', handleEmailVisibilityPolicy);
  return app;
}

describe('handleEmailVisibilityPolicy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.token = 'policy-secret';
    mocks.getSuppressions.mockResolvedValue([
      'login@example.com',
      'linked@example.com',
    ]);
    mocks.loggerError.mockReset();
  });

  it.each([
    ['missing', undefined],
    ['incorrect', 'Bearer wrong-secret'],
  ])(
    'rejects %s bearer credentials without querying data',
    async (_, value) => {
      const response = await createApp().request(
        '/api/internal/email-visibility-policy',
        { headers: value ? { Authorization: value } : {} },
      );

      expect(response.status).toBe(401);
      expect(mocks.getSuppressions).not.toHaveBeenCalled();
    },
  );

  it('rejects access when the token is unconfigured', async () => {
    mocks.token = '';

    const response = await createApp().request(
      '/api/internal/email-visibility-policy',
      { headers: { Authorization: 'Bearer policy-secret' } },
    );

    expect(response.status).toBe(401);
    expect(mocks.getSuppressions).not.toHaveBeenCalled();
  });

  it('returns only normalized suppression addresses for the valid token', async () => {
    const response = await createApp().request(
      '/api/internal/email-visibility-policy',
      { headers: { Authorization: 'Bearer policy-secret' } },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({
      suppressed_emails: ['login@example.com', 'linked@example.com'],
    });
    expect(mocks.getSuppressions).toHaveBeenCalledOnce();
  });

  it('rejects an invalid projection without logging its address values', async () => {
    mocks.getSuppressions.mockResolvedValueOnce([
      'invalid private@example.com',
    ]);

    const response = await createApp().request(
      '/api/internal/email-visibility-policy',
      { headers: { Authorization: 'Bearer policy-secret' } },
    );

    expect(response.status).toBe(500);
    expect(JSON.stringify(mocks.loggerError.mock.calls)).not.toContain(
      'private@example.com',
    );
  });
});
