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
    expect(determineRowYear(row, tableWithMultipleYears)).toBe(0);
  });

  it('should return the year from the "Дата події" field if present and formatted with dots', () => {
    const row = { 'Дата події': '12.05.1993' };
    expect(determineRowYear(row, tableWithSingleYear)).toBe(1993);
  });

  it('should return the year from the "Дата події" field if present and formatted with slashes', () => {
    const row = { 'Дата події': '12/05/1994' };
    expect(determineRowYear(row, tableWithSingleYear)).toBe(1994);
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
});
