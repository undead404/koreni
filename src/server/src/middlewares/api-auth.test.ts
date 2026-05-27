import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import isValidApiKey from '../helpers/is-valid-api-key.js';
import posthog from '../services/posthog.js';
import validateTurnstile from '../services/validate-turnstile.js';

import { apiAuthMiddleware } from './api-auth.js';

const { mockEnv } = vi.hoisted(() => {
  return {
    mockEnv: {
      NODE_ENV: 'production',
    },
  };
});

vi.mock('../environment.js', () => ({
  default: mockEnv,
}));

vi.mock('@hono/node-server/conninfo', () => ({
  getConnInfo: vi.fn(() => ({
    remote: {
      address: '127.0.0.1',
    },
  })),
}));

vi.mock('../helpers/get-client-identifier.js', () => ({
  default: vi.fn(() => 'mock-client-id'),
}));

vi.mock('../helpers/is-valid-api-key.js', () => ({
  default: vi.fn(),
}));

vi.mock('../services/posthog.js', () => ({
  default: {
    capture: vi.fn(),
  },
}));

vi.mock('../services/validate-turnstile.js', () => ({
  default: vi.fn(),
}));

describe('apiAuthMiddleware', () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv.NODE_ENV = 'production';

    app = new Hono();
    app.use('*', apiAuthMiddleware);
    app.post('/test', async (c) => {
      const body = await c.req.json();
      return c.json({ success: true, body });
    });
  });

  it('should bypass auth check when a valid API key is provided', async () => {
    vi.mocked(isValidApiKey).mockReturnValue(true);

    const requestBody = { turnstileToken: 'dummy' };
    const response = await app.request(
      new Request('http://localhost/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'valid-key',
        },
        body: JSON.stringify(requestBody),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, body: requestBody });
    expect(validateTurnstile).not.toHaveBeenCalled();
  });

  it('should bypass Turnstile verification in non-production environments', async () => {
    mockEnv.NODE_ENV = 'development';
    vi.mocked(isValidApiKey).mockReturnValue(false);

    const requestBody = { turnstileToken: 'some-token' };
    const response = await app.request(
      new Request('http://localhost/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, body: requestBody });
    expect(validateTurnstile).not.toHaveBeenCalled();
  });

  it('should return 400 and capture event when token is missing in production without API key', async () => {
    vi.mocked(isValidApiKey).mockReturnValue(false);

    const response = await app.request(
      new Request('http://localhost/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Captcha token is required',
    });
    expect(posthog.capture).toHaveBeenCalledWith(
      expect.objectContaining({
        distinctId: 'mock-client-id',
        event: 'turnstile_token_missing',
        properties: expect.objectContaining({
          ip: '127.0.0.1',
        }),
      }),
    );
  });

  it('should return 403 and capture event with error-codes on Turnstile validation failure', async () => {
    vi.mocked(isValidApiKey).mockReturnValue(false);
    vi.mocked(validateTurnstile).mockResolvedValue({
      success: false,
      'error-codes': ['timeout-or-duplicate'],
    });

    const response = await app.request(
      new Request('http://localhost/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ turnstileToken: 'invalid-token' }),
      }),
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: 'Captcha validation failed',
    });
    expect(posthog.capture).toHaveBeenCalledWith(
      expect.objectContaining({
        distinctId: 'mock-client-id',
        event: 'turnstile_validation_failed',
        properties: expect.objectContaining({
          ip: '127.0.0.1',
          reason: ['timeout-or-duplicate'],
        }),
      }),
    );
  });

  it('should pass authentication and reach dummy route on valid Turnstile token', async () => {
    vi.mocked(isValidApiKey).mockReturnValue(false);
    vi.mocked(validateTurnstile).mockResolvedValue({
      success: true,
    });

    const requestBody = { turnstileToken: 'valid-token' };
    const response = await app.request(
      new Request('http://localhost/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, body: requestBody });
    expect(validateTurnstile).toHaveBeenCalledWith('127.0.0.1', 'valid-token');
  });

  it('should return 400 Bad Request immediately when payload structure is invalid', async () => {
    vi.mocked(isValidApiKey).mockReturnValue(false);

    const response = await app.request(
      new Request('http://localhost/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ turnstileToken: 123 }),
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Invalid payload structure',
    });
    expect(validateTurnstile).not.toHaveBeenCalled();
    expect(posthog.capture).not.toHaveBeenCalled();
  });
});
