import { describe, it, expect, vi } from 'vitest';
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

  it('should handle non-numeric row numbers gracefully', () => {
    expect(guessPageFromRowId('table-abc')).toBeNaN();
    expect(guessPageFromRowId('table-')).toBeNaN();
  });

  it('should handle invalid rowId formats gracefully', () => {
    expect(guessPageFromRowId('invalid-row-id')).toBeNaN();
    expect(guessPageFromRowId('')).toBeNaN();
  });
});
