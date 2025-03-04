import { describe, it, expect } from 'vitest';

import { indexationTableSchema } from './indexation-table';

describe('indexationTableSchema', () => {
  it('should validate a correct indexation table', () => {
    const validTable = {
      id: 1,
      tableFilename: 'valid_filename.csv',
      location: [50.4501, 30.5234],
      size: 100,
      sources: ['source1', 'source2'],
      title: 'Valid Title',
      tableLocale: 'uk',
    };
    expect(() => indexationTableSchema.parse(validTable)).not.toThrow();
  });

  it('should invalidate a table with missing fields', () => {
    const invalidTable = {
      id: 1,
      tableFilename: 'valid_filename.csv',
      location: [50.4501, 30.5234],
      size: 100,
      sources: ['source1', 'source2'],
      title: 'Valid Title',
    };
    expect(() => indexationTableSchema.parse(invalidTable)).toThrow();
  });

  it('should invalidate a table with invalid id', () => {
    const invalidTable = {
      id: 0,
      tableFilename: 'valid_filename.csv',
      location: [50.4501, 30.5234],
      size: 100,
      sources: ['source1', 'source2'],
      title: 'Valid Title',
      tableLocale: 'uk',
    };
    expect(() => indexationTableSchema.parse(invalidTable)).toThrow();
  });

  it('should invalidate a table with invalid size', () => {
    const invalidTable = {
      id: 1,
      tableFilename: 'valid_filename.csv',
      location: [50.4501, 30.5234],
      size: 0,
      sources: ['source1', 'source2'],
      title: 'Valid Title',
      tableLocale: 'uk',
    };
    expect(() => indexationTableSchema.parse(invalidTable)).toThrow();
  });

  it('should invalidate a table with invalid locale', () => {
    const invalidTable = {
      id: 1,
      tableFilename: 'valid_filename.csv',
      location: [50.4501, 30.5234],
      size: 100,
      sources: ['source1', 'source2'],
      title: 'Valid Title',
      tableLocale: 'en',
    };
    expect(() => indexationTableSchema.parse(invalidTable)).toThrow();
  });

  it('should invalidate a table with an empty source', () => {
    const invalidTable = {
      id: 1,
      tableFilename: 'valid_filename.csv',
      location: [50.4501, 30.5234],
      size: 100,
      sources: [''],
      title: 'Valid Title',
      tableLocale: 'uk',
    };
    expect(() => indexationTableSchema.parse(invalidTable)).toThrow();
  });
});
