import { describe, expect, it } from 'vitest';

import type { IndexationTable } from './schemas/indexation-table';
import validateMetadata from './validate-metadata';

describe('validateMetadata', () => {
  const createMockTable = (overrides: Partial<IndexationTable>): IndexationTable => {
    return {
      id: 'test-id',
      tableFilePath: 'test-path.csv',
      title: 'Test Title',
      authorName: 'Test Author',
      tableLocale: 'uk',
      ...overrides,
    } as IndexationTable;
  };

  it('should not throw when all metadata is distinct', () => {
    const metadata = [
      createMockTable({ id: '1', tableFilePath: 'path1.csv', title: 'Title 1' }),
      createMockTable({ id: '2', tableFilePath: 'path2.csv', title: 'Title 2' }),
    ];

    expect(() => validateMetadata(metadata)).not.toThrow();
  });

  it('should throw when ids are duplicated', () => {
    const metadata = [
      createMockTable({ id: 'duplicate-id', tableFilePath: 'path1.csv', title: 'Title 1' }),
      createMockTable({ id: 'duplicate-id', tableFilePath: 'path2.csv', title: 'Title 2' }),
    ];

    expect(() => validateMetadata(metadata)).toThrowError('Appears more than once: duplicate-id');
  });

  it('should throw when tableFilePaths are duplicated', () => {
    const metadata = [
      createMockTable({ id: '1', tableFilePath: 'duplicate-path.csv', title: 'Title 1' }),
      createMockTable({ id: '2', tableFilePath: 'duplicate-path.csv', title: 'Title 2' }),
    ];

    expect(() => validateMetadata(metadata)).toThrowError('Appears more than once: duplicate-path.csv');
  });

  it('should throw when titles are duplicated', () => {
    const metadata = [
      createMockTable({ id: '1', tableFilePath: 'path1.csv', title: 'Duplicate Title' }),
      createMockTable({ id: '2', tableFilePath: 'path2.csv', title: 'Duplicate Title' }),
    ];

    expect(() => validateMetadata(metadata)).toThrowError('Appears more than once: Duplicate Title');
  });
});
