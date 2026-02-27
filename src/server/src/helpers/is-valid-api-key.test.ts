import { describe, expect, it, vi } from 'vitest';

import isValidApiKey from './is-valid-api-key.js';

vi.mock('../environment', () => ({
  default: {
    VALID_API_KEYS: new Set(['valid-key-1', 'valid-key-2']),
  },
}));

describe('isValidApiKey', () => {
  it('should return false if apiKey is undefined', () => {
    expect(isValidApiKey(undefined)).toBe(false);
  });

  it('should return false if apiKey is an empty string', () => {
    expect(isValidApiKey('')).toBe(false);
  });

  it('should return false if apiKey is not in VALID_API_KEYS', () => {
    expect(isValidApiKey('invalid-key')).toBe(false);
  });

  it('should return true if apiKey is in VALID_API_KEYS', () => {
    expect(isValidApiKey('valid-key-1')).toBe(true);
    expect(isValidApiKey('valid-key-2')).toBe(true);
  });
});
