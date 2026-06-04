import path from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import getTablesMetadata from './get-tables-metadata';
import getYamlFilepaths from './get-yaml-filepaths';
import validateMetadata from './validate-metadata';

const mocks = vi.hoisted(() => ({
  readFile: vi.fn(),
  indexationTableSchema: {
    parse: vi.fn(),
  },
}));

vi.mock('node:fs/promises', () => ({
  readFile: mocks.readFile,
  default: {
    readFile: mocks.readFile,
  },
}));

vi.mock('./get-yaml-filepaths');
vi.mock('./validate-metadata');
vi.mock('./schemas/indexation-table', () => ({
  indexationTableSchema: mocks.indexationTableSchema,
}));

describe('getTablesMetadata', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should read, parse, validate, and sort metadata successfully', async () => {
    const mockPaths = [
      path.join('data', 'records', 'B.yaml'),
      path.join('data', 'records', 'A.yaml'),
    ];

    vi.mocked(getYamlFilepaths).mockResolvedValue(mockPaths);

    mocks.readFile.mockImplementation((filepath: string) => {
      const pathString = filepath;
      if (pathString.endsWith('B.yaml')) return Promise.resolve('id: B');
      if (pathString.endsWith('A.yaml')) return Promise.resolve('id: A');
      return Promise.resolve('');
    });

    mocks.indexationTableSchema.parse.mockImplementation((data: any) => data);

    const result = await getTablesMetadata();

    expect(getYamlFilepaths).toHaveBeenCalled();
    expect(mocks.readFile).toHaveBeenCalledTimes(2);
    expect(mocks.indexationTableSchema.parse).toHaveBeenCalledTimes(2);
    expect(validateMetadata).toHaveBeenCalledWith([{ id: 'B' }, { id: 'A' }]);

    // Should be sorted by id
    expect(result).toEqual([{ id: 'A' }, { id: 'B' }]);
  });

  it('should throw an error if filename does not match id', async () => {
    const mockPaths = [path.join('data', 'records', 'mismatch.yaml')];

    vi.mocked(getYamlFilepaths).mockResolvedValue(mockPaths);
    mocks.readFile.mockResolvedValue('id: different_id');
    mocks.indexationTableSchema.parse.mockReturnValue({
      id: 'different_id',
    } as any);

    await expect(getTablesMetadata()).rejects.toThrow('Filename mismatch');
  });
});
