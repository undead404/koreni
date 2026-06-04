import path from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import getYamlFilepaths from './get-yaml-filepaths';

const mocks = vi.hoisted(() => ({
  readdir: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  readdir: mocks.readdir,
  default: {
    readdir: mocks.readdir,
  },
}));

describe('getYamlFilepaths', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return only .yaml files with their full paths', async () => {
    mocks.readdir.mockResolvedValue([
      'data1.yaml',
      'data2.yml',
      'readme.md',
      'config.yaml',
    ] as any);

    const folder = 'test/folder';
    const result = await getYamlFilepaths(folder);

    expect(result).toEqual([
      path.join(folder, 'data1.yaml'),
      path.join(folder, 'config.yaml'),
    ]);
    expect(mocks.readdir).toHaveBeenCalledWith(folder);
  });

  it('should return an empty array if no .yaml files are present', async () => {
    mocks.readdir.mockResolvedValue([
      'data.json',
      'image.png',
      'script.js',
    ] as any);

    const folder = 'another/folder';
    const result = await getYamlFilepaths(folder);

    expect(result).toEqual([]);
    expect(mocks.readdir).toHaveBeenCalledWith(folder);
  });

  it('should return an empty array for an empty directory', async () => {
    mocks.readdir.mockResolvedValue([] as any);

    const folder = 'empty/folder';
    const result = await getYamlFilepaths(folder);

    expect(result).toEqual([]);
    expect(mocks.readdir).toHaveBeenCalledWith(folder);
  });
});
