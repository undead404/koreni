import { describe, expect, it, vi } from 'vitest';

import guessPageFromRowId from './guess-page-from-row-id';

vi.mock('../constants', () => ({
  PER_PAGE: 10,
}));

describe('guessPageFromRowId', () => {
  it('should return the correct page number for a given rowId', () => {
    expect(guessPageFromRowId('table-1')).toBe(1);
    expect(guessPageFromRowId('table-10')).toBe(1);
    expect(guessPageFromRowId('table-11')).toBe(2);
    expect(guessPageFromRowId('table-20')).toBe(2);
    expect(guessPageFromRowId('table-21')).toBe(3);
  });

  it('should work for longer ids', () => {
    expect(guessPageFromRowId('table-whatever-13')).toBe(2);
  });

  it('should throw at empty row id', () => {
    expect(() => guessPageFromRowId('')).toThrow();
  });

  it('should throw at invalid formats', () => {
    expect(() => guessPageFromRowId('invalid-row-id')).toThrow();
  });
});
