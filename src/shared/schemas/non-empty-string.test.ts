import { describe, expect, it } from 'vitest';

import { nonEmptyString } from './non-empty-string.js';

describe('nonEmptyString', () => {
  it('should validate a non-empty string', () => {
    const result = nonEmptyString.safeParse('valid string');
    expect(result.success).toBe(true);
  });

  it('should throw an error for an empty string', () => {
    const result = nonEmptyString.safeParse('');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0]!.message).toBe(
        'String must contain at least 1 character(s)',
      );
    }
  });

  it('should throw an error for a non-string value', () => {
    const result = nonEmptyString.safeParse(123);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0]!.message).toBe(
        'Expected string, received number',
      );
    }
  });
});
