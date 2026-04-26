import { describe, expect,it } from 'vitest';

import getCurrentDate from './get-current-date.js';

describe('getCurrentDate', () => {
  it('should return a valid date string', () => {
    const date = getCurrentDate();
    expect(typeof date).toBe('string');
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should return the current date', () => {
    const expected = new Date().toISOString().split('T')[0];
    const date = getCurrentDate();
    expect(date).toBe(expected);
  });
});
