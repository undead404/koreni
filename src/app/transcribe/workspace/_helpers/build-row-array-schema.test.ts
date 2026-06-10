import { describe, expect, it } from 'vitest';

import { buildRowArraySchema } from './build-row-array-schema';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

const singleColumn = [
  { id: 'col1', title: 'Col 1', hint: '', expectedType: 'string' as const },
];

describe('buildRowArraySchema', () => {
  it('accepts a valid row', () => {
    const schema = buildRowArraySchema(singleColumn);
    const result = schema.safeParse([{ id: VALID_UUID, col1: 'hello' }]);
    expect(result.success).toBe(true);
  });

  it('rejects a row with a non-UUID id', () => {
    const schema = buildRowArraySchema(singleColumn);
    const result = schema.safeParse([{ id: 'not-a-uuid', col1: 'hello' }]);
    expect(result.success).toBe(false);
  });

  it('rejects a row missing a declared column', () => {
    const schema = buildRowArraySchema(singleColumn);
    const result = schema.safeParse([{ id: VALID_UUID }]);
    expect(result.success).toBe(false);
  });

  it('accepts a valid row with multiple columns', () => {
    const columns = [
      { id: 'HH', title: '#HH', hint: '', expectedType: 'number' as const },
      { id: 'Name', title: 'Name', hint: '', expectedType: 'string' as const },
    ];
    const schema = buildRowArraySchema(columns);
    const result = schema.safeParse([
      { id: VALID_UUID, HH: '1', Name: 'Ivan' },
    ]);
    expect(result.success).toBe(true);
  });

  it('accepts an empty array', () => {
    const schema = buildRowArraySchema(singleColumn);
    const result = schema.safeParse([]);
    expect(result.success).toBe(true);
  });

  it('rejects a non-array input', () => {
    const schema = buildRowArraySchema(singleColumn);
    const result = schema.safeParse({ id: VALID_UUID, col1: 'x' });
    expect(result.success).toBe(false);
  });

  it('accepts a row when columns array is empty', () => {
    const schema = buildRowArraySchema([]);
    const result = schema.safeParse([{ id: VALID_UUID }]);
    expect(result.success).toBe(true);
  });
});

const dateColumn = [
  { id: 'Дата', title: 'Дата', expectedType: 'date' as const },
];

describe('buildRowArraySchema — date column', () => {
  it('accepts a full date YYYY-MM-DD', () => {
    const schema = buildRowArraySchema(dateColumn);
    const result = schema.safeParse([{ id: VALID_UUID, Дата: '1743-05-12' }]);
    expect(result.success).toBe(true);
  });

  it('accepts a partial date YYYY-MM', () => {
    const schema = buildRowArraySchema(dateColumn);
    const result = schema.safeParse([{ id: VALID_UUID, Дата: '1743-05' }]);
    expect(result.success).toBe(true);
  });

  it('accepts a year-only date YYYY', () => {
    const schema = buildRowArraySchema(dateColumn);
    const result = schema.safeParse([{ id: VALID_UUID, Дата: '1743' }]);
    expect(result.success).toBe(true);
  });

  it('accepts an empty string (row not yet filled)', () => {
    const schema = buildRowArraySchema(dateColumn);
    const result = schema.safeParse([{ id: VALID_UUID, Дата: '' }]);
    expect(result.success).toBe(true);
  });

  it('rejects a dot-separated date', () => {
    const schema = buildRowArraySchema(dateColumn);
    const result = schema.safeParse([{ id: VALID_UUID, Дата: '12.05.1743' }]);
    expect(result.success).toBe(false);
  });

  it('rejects arbitrary prose', () => {
    const schema = buildRowArraySchema(dateColumn);
    const result = schema.safeParse([
      { id: VALID_UUID, Дата: 'arbitrary prose' },
    ]);
    expect(result.success).toBe(false);
  });

  it('rejects an invalid month (13)', () => {
    const schema = buildRowArraySchema(dateColumn);
    const result = schema.safeParse([{ id: VALID_UUID, Дата: '1743-13-01' }]);
    expect(result.success).toBe(false);
  });
});
