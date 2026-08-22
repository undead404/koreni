import { describe, expect, it, vi } from 'vitest';

import { createLogger, hashForLogging, sanitizeLogFields } from './logger.js';

describe('logger', () => {
  it('writes structured JSON and protects sensitive fields', () => {
    const write = vi.fn();
    createLogger(write).info('auth.attempt', {
      email: 'person@example.com',
      token: 'secret-token',
      nested: { password: 'secret-password' },
    });

    const record = JSON.parse(write.mock.calls[0][0] as string) as Record<
      string,
      unknown
    >;
    expect(record.event).toBe('auth.attempt');
    expect(record.email).toBe(hashForLogging('person@example.com'));
    expect(record.token).toBe('[REDACTED]');
    expect(record.nested).toEqual({ password: '[REDACTED]' });
  });

  it('serializes errors without stack traces', () => {
    expect(sanitizeLogFields({ error: new Error('failure') })).toEqual({
      error: { name: 'Error', message: 'failure' },
    });
  });

  it('handles circular fields and writer failures without throwing', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const write = vi.fn(() => {
      throw new Error('output unavailable');
    });

    expect(() => {
      createLogger(write).warn('test.circular', { circular });
    }).not.toThrow();
    expect(write).toHaveBeenCalled();
  });

  it('hashes submission identifiers as well as user identifiers', () => {
    expect(sanitizeLogFields({ submissionId: 'private-project' })).toEqual({
      submissionId: hashForLogging('private-project'),
    });
  });
});
