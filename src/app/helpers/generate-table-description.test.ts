import { describe, expect, it } from 'vitest';

import type { IndexationTable } from '@/shared/schemas/indexation-table';

import generateTableDescription from './generate-table-description';

describe('generateTableDescription', () => {
  const baseTable = {
    id: 'test-table-1',
    size: 150,
    tableLocale: 'uk',
    yearsRange: [1897],
    date: new Date('2023-08-24T00:00:00Z'),
  } as IndexationTable;

  it('generates a correct description for a single year and Ukrainian locale', () => {
    const result = generateTableDescription(baseTable);
    expect(result).toMatch(/^150 записів українською мовою за 1897 рік, проіндексованих 24 серпня 2023/);
  });

  it('generates a correct description for a year range and Polish locale', () => {
    const table = {
      ...baseTable,
      tableLocale: 'pl',
      yearsRange: [1900, 1905],
    } as IndexationTable;
    
    const result = generateTableDescription(table);
    expect(result).toMatch(/^150 записів польською мовою за 1900–1905 роки, проіндексованих 24 серпня 2023/);
  });

  it('generates a correct description for Russian locale', () => {
    const table = {
      ...baseTable,
      tableLocale: 'ru',
    } as IndexationTable;
    
    const result = generateTableDescription(table);
    expect(result).toContain('російською мовою');
  });

  it('throws an error for an unknown locale', () => {
    const table = {
      ...baseTable,
      tableLocale: 'en',
    } as unknown as IndexationTable;
    
    expect(() => generateTableDescription(table)).toThrowError(
      'Unknown table locale for table test-table-1: en'
    );
  });
});
