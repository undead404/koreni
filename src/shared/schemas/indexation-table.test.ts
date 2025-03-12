import { describe, expect, it } from 'vitest';

import { indexationTableSchema } from './indexation-table';

describe('indexationTableSchema', () => {
  it('should validate a correct indexation table', () => {
    const validTable = {
      date: '2024-09-17',
      id: 'valid-id',
      tableFilename: 'valid_filename.csv',
      location: [50.4501, 30.5234],
      size: 100,
      sources: ['source1', 'source2'],
      title: 'Valid Title',
      tableLocale: 'uk',
      yearsRange: [1822, 1853],
    };
    expect(() => indexationTableSchema.parse(validTable)).not.toThrow();
  });

  it('should invalidate a table with missing fields', () => {
    const invalidTable = {
      id: 'invalid-id',
      tableFilename: 'valid_filename.csv',
      location: [50.4501, 30.5234],
      size: 100,
      sources: ['source1', 'source2'],
      title: 'Valid Title',
      yearsRange: [1822, 1853],
    };
    expect(() => indexationTableSchema.parse(invalidTable)).toThrow();
  });

  it('should invalidate a table with invalid id', () => {
    const invalidTable = {
      date: '2024-09-17',
      id: '',
      tableFilename: 'valid_filename.csv',
      location: [50.4501, 30.5234],
      size: 100,
      sources: ['source1', 'source2'],
      title: 'Valid Title',
      tableLocale: 'uk',
      yearsRange: [1822, 1853],
    };
    expect(() => indexationTableSchema.parse(invalidTable)).toThrow();
  });

  it('should invalidate a table with invalid size', () => {
    const invalidTable = {
      date: '2024-09-17',
      id: 'valid-id',
      tableFilename: 'valid_filename.csv',
      location: [50.4501, 30.5234],
      size: 0,
      sources: ['source1', 'source2'],
      title: 'Valid Title',
      tableLocale: 'uk',
      yearsRange: [1822, 1853],
    };
    expect(() => indexationTableSchema.parse(invalidTable)).toThrow();
  });

  it('should invalidate a table with invalid locale', () => {
    const invalidTable = {
      date: '2024-09-17',
      id: 'valid-id',
      tableFilename: 'valid_filename.csv',
      location: [50.4501, 30.5234],
      size: 100,
      sources: ['source1', 'source2'],
      title: 'Valid Title',
      tableLocale: 'en',
      yearsRange: [1822, 1853],
    };
    expect(() => indexationTableSchema.parse(invalidTable)).toThrow();
  });

  it('should invalidate a table with missing yearsRange', () => {
    const invalidTable = {
      date: '2024-09-17',
      id: 'valid-id',
      tableFilename: 'valid_filename.csv',
      location: [50.4501, 30.5234],
      size: 100,
      sources: ['source1', 'source2'],
      title: 'Valid Title',
      tableLocale: 'uk',
    };
    expect(() => indexationTableSchema.parse(invalidTable)).toThrow();
  });

  it('should invalidate a table with empty yearsRange', () => {
    const invalidTable = {
      date: '2024-09-17',
      id: 'valid-id',
      tableFilename: 'valid_filename.csv',
      location: [50.4501, 30.5234],
      size: 100,
      sources: ['source1', 'source2'],
      title: 'Valid Title',
      tableLocale: 'uk',
      yearsRange: [],
    };
    expect(() => indexationTableSchema.parse(invalidTable)).toThrow();
  });

  it('should invalidate a table with big yearsRange', () => {
    const invalidTable = {
      date: '2024-09-17',
      id: 'valid-id',
      tableFilename: 'valid_filename.csv',
      location: [50.4501, 30.5234],
      size: 100,
      sources: ['source1', 'source2'],
      title: 'Valid Title',
      tableLocale: 'uk',
      yearsRange: [1822, 1823, 1824],
    };
    expect(() => indexationTableSchema.parse(invalidTable)).toThrow();
  });
});
