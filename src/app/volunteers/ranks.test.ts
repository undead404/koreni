import { describe, expect, it } from 'vitest';

import { getRank } from './ranks';

describe('getRank', () => {
  it('should return correct rank for "Хранитель" (>= 10000)', () => {
    expect(getRank(10_000)?.title).toBe('Хранитель');
    expect(getRank(100_000)?.title).toBe('Хранитель');
  });

  it('should return correct rank for "Архіваріус" (>= 1000)', () => {
    expect(getRank(1000)?.title).toBe('Архіваріус');
    expect(getRank(9999)?.title).toBe('Архіваріус');
  });

  it('should return correct rank for "Реєстратор" (>= 100)', () => {
    expect(getRank(100)?.title).toBe('Реєстратор');
    expect(getRank(999)?.title).toBe('Реєстратор');
  });

  it('should return correct rank for "Писар" (>= 0)', () => {
    expect(getRank(0)?.title).toBe('Писар');
    expect(getRank(99)?.title).toBe('Писар');
  });

  it('should fallback to last rank if power is negative (though unlikely)', () => {
    expect(getRank(-1)?.title).toBe('Писар');
  });
});
