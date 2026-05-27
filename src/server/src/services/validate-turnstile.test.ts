import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { reportError } from './bugsnag.js';
import validateTurnstile from './validate-turnstile.js';

// Mock environment
vi.mock('../environment.js', () => ({
  default: {
    TURNSTILE_SECRET_KEY: 'mock-secret-key',
  },
}));

// Mock Bugsnag utility
vi.mock('./bugsnag.js', () => ({
  reportError: vi.fn(),
  Bugsnag: {
    notify: vi.fn(),
  },
}));

describe('validateTurnstile service', () => {
  const fetchMock = vi.fn();

  beforeAll(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Happy Path', () => {
    it('should successfully parse and return validated response from Cloudflare', async () => {
      fetchMock.mockResolvedValue({
        json: () =>
          Promise.resolve({
            success: true,
            challenge_ts: '2026-05-27T12:00:00.000Z',
            hostname: 'example.com',
          }),
      });

      const result = await validateTurnstile('127.0.0.1', 'valid-token');

      // Verify fetch was called with correct parameters
      expect(fetchMock).toHaveBeenCalledWith(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            secret: 'mock-secret-key',
            response: 'valid-token',
            remoteip: '127.0.0.1',
          }),
        }),
      );

      // Verify correct output returned
      expect(result).toEqual({
        success: true,
        challenge_ts: '2026-05-27T12:00:00.000Z',
        hostname: 'example.com',
      });

      // Bugsnag reporter should not be called
      expect(reportError).not.toHaveBeenCalled();
    });
  });

  describe('Network Failure', () => {
    it('should report the network error to Bugsnag and return failure status', async () => {
      const networkError = new Error('DNS resolution failed');
      fetchMock.mockRejectedValue(networkError);

      const result = await validateTurnstile('127.0.0.1', 'any-token');

      // Verify telemetry is triggered
      expect(reportError).toHaveBeenCalledWith(networkError);

      // Verify deterministic failure state
      expect(result).toEqual({
        success: false,
        'error-codes': ['network-error'],
      });
    });
  });

  describe('Schema Validation Failure', () => {
    it('should report Zod validation error to Bugsnag and return failure status on malformed JSON response', async () => {
      fetchMock.mockResolvedValue({
        json: () =>
          Promise.resolve({
            // missing required 'success' boolean
            challenge_ts: '2026-05-27T12:00:00.000Z',
          }),
      });

      const result = await validateTurnstile('127.0.0.1', 'any-token');

      // Verify telemetry is triggered
      expect(reportError).toHaveBeenCalled();

      // Check that a ZodError was passed to reportError
      const errorPassed = vi.mocked(reportError).mock.calls[0][0];
      expect(errorPassed).toBeInstanceOf(Error);
      expect((errorPassed as Error).name).toBe('ZodError');

      // Verify deterministic failure state
      expect(result).toEqual({
        success: false,
        'error-codes': ['invalid-response-shape'],
      });
    });
  });
});
