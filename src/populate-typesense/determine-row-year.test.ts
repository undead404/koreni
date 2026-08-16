import { describe, expect, it } from 'vitest';

import type { IndexationTable } from '@/shared/schemas/indexation-table';

import determineRowYear from './determine-row-year';

describe('determineRowYear', () => {
  const tableWithSingleYear = { yearsRange: [2020] } as IndexationTable;
  const tableWithMultipleYears = {
    yearsRange: [2020, 2021],
  } as IndexationTable;

  it('should return the year from the "Рік" field if present', () => {
    const row = { Рік: '1990' };
    expect(determineRowYear(row, tableWithSingleYear)).toBe(1990);
  });

  it('should return the year from the "Год" field if present', () => {
    const row = { Год: '1890' };
    expect(determineRowYear(row, tableWithSingleYear)).toBe(1890);
  });

  it('should return the year from the "рік життя" field if present', () => {
    const row = { 'рік життя': '1991' };
    expect(determineRowYear(row, tableWithSingleYear)).toBe(1991);
  });

  it('should return the year from the "Рік сповідки" field if present', () => {
    const row = { 'Рік сповідки': '1992' };
    expect(determineRowYear(row, tableWithSingleYear)).toBe(1992);
  });

  it('should return 0 if the year field is an empty string', () => {
    const row = { Рік: '' };
    const result = determineRowYear(row, tableWithMultipleYears);
    expect(result).toBe(0);
  });

  it('should use table year if year field is empty string with single year table', () => {
    const row = { Рік: '' };
    const result = determineRowYear(row, tableWithSingleYear);
    expect(result).toBe(2020);
  });

  it('should return the year from the "Дата події" field if present and formatted with dots', () => {
    const row = { 'Дата події': '12.05.1993' };
    expect(determineRowYear(row, tableWithSingleYear)).toBe(1993);
  });

  it('should return the year from the "Дата події" field if present and formatted with slashes', () => {
    const row = { 'Дата події': '12/05/1994' };
    expect(determineRowYear(row, tableWithSingleYear)).toBe(1994);
  });

  it('should return the year from the "Дата події" field if present and formatted with dashes', () => {
    const row = { 'Дата події': '1996-05-12' };
    expect(determineRowYear(row, tableWithSingleYear)).toBe(1996);
  });

  it('should return the year from alternative date fields like "Начато"', () => {
    const row = { Начато: '01.01.1850' };
    expect(determineRowYear(row, tableWithSingleYear)).toBe(1850);
  });

  it('should return the year from the "Дата події" field if present and formatted as a number', () => {
    const row = { 'Дата події': '1995' };
    expect(determineRowYear(row, tableWithSingleYear)).toBe(1995);
  });

  it('should return 0 if the "Дата події" field is a question mark', () => {
    const row = { 'Дата події': '?' };
    expect(determineRowYear(row, tableWithMultipleYears)).toBe(0);
  });

  it('should return 0 if the "Дата події" field contains a question mark', () => {
    const row = { 'Дата події': '12.05.199?' };
    expect(determineRowYear(row, tableWithMultipleYears)).toBe(0);
  });

  it('should use table year if date parsing results in 0 and table has single year', () => {
    const row = { 'Дата події': '12.05.199?' };
    expect(determineRowYear(row, tableWithSingleYear)).toBe(2020);
  });

  it('should return the single year from the table if no year or date fields are present', () => {
    const row = {};
    expect(determineRowYear(row, tableWithSingleYear)).toBe(2020);
  });

  it('should return 0 and log a warning if no year or date fields are present and the table has multiple years', () => {
    const row = {};
    expect(determineRowYear(row, tableWithMultipleYears)).toBe(0);
  });

  it('should return 0 and log a warning if the date format is invalid', () => {
    const row = { 'Дата події': 'invalid date' };
    expect(determineRowYear(row, tableWithMultipleYears)).toBe(0);
  });

  it('should return 0 if the determined year is not an integer', () => {
    const row = { Рік: '1990.5' };
    expect(determineRowYear(row, tableWithMultipleYears)).toBe(0);
  });

  it('should return 0 if the determined year is negative', () => {
    const row = { Рік: '-100' };
    expect(determineRowYear(row, tableWithMultipleYears)).toBe(0);
  });

  it('should return 0 if the determined year is too large (> 9999)', () => {
    const row = { Рік: '10000' };
    expect(determineRowYear(row, tableWithMultipleYears)).toBe(0);
  });

  it('should return 0 if the determined year is too small (< 1500) but not 0', () => {
    const row = { Рік: '1499' };
    expect(determineRowYear(row, tableWithMultipleYears)).toBe(0);
  });

  it('should return 0 if the year is exactly 0', () => {
    const row = { Рік: '0' };
    expect(determineRowYear(row, tableWithMultipleYears)).toBe(0);
  });

  it('should return 1500 if the year is exactly 1500', () => {
    const row = { Рік: '1500' };
    expect(determineRowYear(row, tableWithMultipleYears)).toBe(1500);
  });

  it('should return 9999 if the year is exactly 9999', () => {
    const row = { Рік: '9999' };
    expect(determineRowYear(row, tableWithMultipleYears)).toBe(9999);
  });

  it('should handle date with dots and filter out "хх" parts', () => {
    const row = { 'Дата події': '12.хх.1985' };
    expect(determineRowYear(row, tableWithSingleYear)).toBe(1985);
  });

  it('should handle date with dots where first part is 4 digits', () => {
    const row = { 'Дата події': '1985.05.12' };
    expect(determineRowYear(row, tableWithSingleYear)).toBe(1985);
  });

  it('should handle date with dots where first part is not 4 digits', () => {
    const row = { 'Дата події': '12.05.1985' };
    expect(determineRowYear(row, tableWithSingleYear)).toBe(1985);
  });

  it('should handle date with slashes', () => {
    const row = { 'Дата події': '12/05/1987' };
    expect(determineRowYear(row, tableWithSingleYear)).toBe(1987);
  });

  it('should handle date with dashes', () => {
    const row = { 'Дата події': '1988-05-12' };
    expect(determineRowYear(row, tableWithSingleYear)).toBe(1988);
  });

  it('should handle numeric date value', () => {
    const row = { 'Дата події': 1989 };
    expect(determineRowYear(row, tableWithSingleYear)).toBe(1989);
  });

  it('should extract year even if date contains question mark in the middle', () => {
    const row = { 'Дата події': '12.?5.1990' };
    expect(determineRowYear(row, tableWithMultipleYears)).toBe(1990);
  });

  it('should return 0 if date is invalid format with no separators', () => {
    const row = { 'Дата події': 'abcd' };
    expect(determineRowYear(row, tableWithMultipleYears)).toBe(0);
  });

  it('should return 0 if date is invalid format with numbers but not parseable', () => {
    const row = { 'Дата події': '12ab34' };
    expect(determineRowYear(row, tableWithMultipleYears)).toBe(0);
  });

  it('should prioritize year field over date field', () => {
    const row = { Рік: '2000', 'Дата події': '1990' };
    expect(determineRowYear(row, tableWithSingleYear)).toBe(2000);
  });

  it('should use table year range when no year or date fields are present', () => {
    const row = { someOtherField: 'value' };
    expect(determineRowYear(row, tableWithSingleYear)).toBe(2020);
  });

  it('should return 0 when no year or date fields and table has multiple years', () => {
    const row = { someOtherField: 'value' };
    expect(determineRowYear(row, tableWithMultipleYears)).toBe(0);
  });

  it('should handle all year field variations', () => {
    const fields = [
      'Рік сповідки',
      'рік життя',
      'рік смерті',
      'рік народження',
      'Рік народження',
      'Рік одруження',
      'Рік смерті',
    ];
    for (const field of fields) {
      const row = { [field]: '1980' };
      expect(determineRowYear(row, tableWithSingleYear)).toBe(1980);
    }
  });

  it('should handle all date field variations', () => {
    const fields = [
      'Дата події',
      'Дата события',
      'Дата зап.',
      'Дата',
      'Дата народження',
      'Дата нар.',
      'Дата рождения',
      'Дата одруження',
      'Дата шлюбу',
      'Дата смерти',
      'Дата смерті',
      'дата крещ',
      'Начато',
      'Окончено',
      'дата нар.',
      'дата',
      'Народження',
      'Хрещення',
    ];
    for (const field of fields) {
      const row = { [field]: '01.01.1975' };
      expect(determineRowYear(row, tableWithSingleYear)).toBe(1975);
    }
  });

  it('should handle date with multiple dots and filter хх', () => {
    const row = { 'Дата події': '12.хх.хх.1970' };
    expect(determineRowYear(row, tableWithSingleYear)).toBe(1970);
  });

  it('should return 0 if year is NaN', () => {
    const row = { Рік: 'not a number' };
    expect(determineRowYear(row, tableWithMultipleYears)).toBe(0);
  });

  it('should handle edge case: year 1500 (minimum valid year)', () => {
    const row = { Рік: '1500' };
    expect(determineRowYear(row, tableWithMultipleYears)).toBe(1500);
  });

  it('should handle edge case: year 1501 (just above minimum)', () => {
    const row = { Рік: '1501' };
    expect(determineRowYear(row, tableWithMultipleYears)).toBe(1501);
  });

  it('should handle edge case: year 9998 (just below maximum)', () => {
    const row = { Рік: '9998' };
    expect(determineRowYear(row, tableWithMultipleYears)).toBe(9998);
  });

  it('should handle date with only dots and no valid year', () => {
    const row = { 'Дата події': '...' };
    expect(determineRowYear(row, tableWithMultipleYears)).toBe(0);
  });

  it('should handle empty row object with single year table', () => {
    const row = {};
    expect(determineRowYear(row, tableWithSingleYear)).toBe(2020);
  });

  it('should handle row with null values', () => {
    const row = { Рік: null };
    expect(determineRowYear(row, tableWithMultipleYears)).toBe(0);
  });

  it('should handle row with undefined values', () => {
    const row = { Рік: undefined };
    expect(determineRowYear(row, tableWithMultipleYears)).toBe(0);
  });

  it('should handle row with false values', () => {
    const row = { Рік: false };
    expect(determineRowYear(row, tableWithMultipleYears)).toBe(0);
  });

  it('should handle row with 0 value', () => {
    const row = { Рік: 0 };
    expect(determineRowYear(row, tableWithMultipleYears)).toBe(0);
  });

  it('should handle year as number type', () => {
    const row = { Рік: 1983 };
    expect(determineRowYear(row, tableWithSingleYear)).toBe(1983);
  });

  it('should handle date as number type', () => {
    const row = { 'Дата події': 1984 };
    expect(determineRowYear(row, tableWithSingleYear)).toBe(1984);
  });

  it('should return 0 for year 1 (too small)', () => {
    const row = { Рік: '1' };
    expect(determineRowYear(row, tableWithMultipleYears)).toBe(0);
  });

  it('should return 0 for year 1000 (too small)', () => {
    const row = { Рік: '1000' };
    expect(determineRowYear(row, tableWithMultipleYears)).toBe(0);
  });

  it('should handle date with dots where all parts are filtered out', () => {
    const row = { 'Дата події': 'хх.хх.хх' };
    expect(determineRowYear(row, tableWithMultipleYears)).toBe(0);
  });

  it('should handle date with only one part after filtering', () => {
    const row = { 'Дата події': '1986.хх.хх' };
    expect(determineRowYear(row, tableWithSingleYear)).toBe(1986);
  });
});
