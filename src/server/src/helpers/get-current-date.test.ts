import { describe, expect, it } from 'vitest';

import getCurrentDate from './get-current-date.js';

describe('getCurrentDate', () => {
  it('should return a valid Date object', () => {
    const date = getCurrentDate();
    expect(date).toBeInstanceOf(Date);
    expect(Number.isNaN(date.getTime())).toBe(false);
  });

  it('should return the current date and time', () => {
    const before = Date.now();
    const date = getCurrentDate().getTime();
    const after = Date.now();

    // The generated date should fall exactly between the 'before' and 'after' timestamps
    expect(date).toBeGreaterThanOrEqual(before);
    expect(date).toBeLessThanOrEqual(after);
  });
});
