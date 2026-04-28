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
    expect(result.error?.issues[0].message).toBe(
      'Очікується хоча б один символ',
    );
  });

  it('should throw an error for a non-string value', () => {
    const result = nonEmptyString.safeParse(123);
    expect(result.success).toBe(false);

    expect(result.error?.issues[0].message).toBe(
      'Invalid input: expected string, received number',
    );
  });
});
