import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { beforeEach,describe, expect, it, vi } from 'vitest';

import { indexationTableSchema } from './schemas/indexation-table';
import getTablesMetadata from './get-tables-metadata';
import getYamlFilepaths from './get-yaml-filepaths';
import validateMetadata from './validate-metadata';

vi.mock('node:fs/promises');
vi.mock('./get-yaml-filepaths');
vi.mock('./validate-metadata');
vi.mock('./schemas/indexation-table', () => ({
  indexationTableSchema: {
    parse: vi.fn(),
  },
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
    
    vi.mocked(readFile).mockImplementation((filepath) => {
      const pathStr = String(filepath);
      if (pathStr.endsWith('B.yaml')) return Promise.resolve('id: B');
      if (pathStr.endsWith('A.yaml')) return Promise.resolve('id: A');
      return Promise.resolve('');
    });
    
    vi.mocked(indexationTableSchema.parse).mockImplementation((data: any) => data);

    const result = await getTablesMetadata();

    expect(getYamlFilepaths).toHaveBeenCalled();
    expect(readFile).toHaveBeenCalledTimes(2);
    expect(indexationTableSchema.parse).toHaveBeenCalledTimes(2);
    expect(validateMetadata).toHaveBeenCalledWith([{ id: 'B' }, { id: 'A' }]);
    
    // Should be sorted by id
    expect(result).toEqual([{ id: 'A' }, { id: 'B' }]);
  });

  it('should throw an error if filename does not match id', async () => {
    const mockPaths = [path.join('data', 'records', 'mismatch.yaml')];
    
    vi.mocked(getYamlFilepaths).mockResolvedValue(mockPaths);
    vi.mocked(readFile).mockResolvedValue('id: different_id');
    vi.mocked(indexationTableSchema.parse).mockReturnValue({ id: 'different_id' } as any);

    await expect(getTablesMetadata()).rejects.toThrow('Filename mismatch');
  });
});
