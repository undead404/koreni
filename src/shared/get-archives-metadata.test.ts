import { describe, expect, it, vi } from 'vitest';

import getArchivesMetadata from './get-archives-metadata';
import getYamlFilepaths from './get-yaml-filepaths';

const mocks = vi.hoisted(() => ({
  readFile: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  default: {
    readFile: mocks.readFile,
  },
  readFile: mocks.readFile,
}));

vi.mock('./get-yaml-filepaths', () => ({
  default: vi.fn(),
}));

describe('getArchivesMetadata', () => {
  it('loads and validates archive metadata', async () => {
    vi.mocked(getYamlFilepaths).mockResolvedValue(['/data/ДАХмО.yaml']);
    mocks.readFile.mockResolvedValue(
      'shortTitle: ДАХмО\ntitle: Державний архів Хмельницької області\nwebsite: https://dahmo.gov.ua/\nwikidataId: Q4146784',
    );

    const archives = await getArchivesMetadata();

    expect(archives.get('ДАХмО')).toEqual({
      shortTitle: 'ДАХмО',
      title: 'Державний архів Хмельницької області',
      website: 'https://dahmo.gov.ua/',
      wikidataId: 'Q4146784',
    });
  });

  it('rejects a filename mismatch', async () => {
    vi.mocked(getYamlFilepaths).mockResolvedValue(['/data/wrong.yaml']);
    mocks.readFile.mockResolvedValue(
      'shortTitle: ДАХмО\ntitle: Archive\nwebsite: https://example.com\nwikidataId: Q1',
    );

    await expect(getArchivesMetadata()).rejects.toThrow('filename mismatch');
  });

  it('loads archive metadata with a blank website', async () => {
    vi.mocked(getYamlFilepaths).mockResolvedValue(['/data/ДААРК.yaml']);
    mocks.readFile.mockResolvedValue(
      'shortTitle: ДААРК\ntitle: Державний архів в Автономній республіці Крим\nwebsite:\nwikidataId: Q12100416',
    );

    const archives = await getArchivesMetadata();

    expect(archives.get('ДААРК')).toStrictEqual({
      shortTitle: 'ДААРК',
      title: 'Державний архів в Автономній республіці Крим',
      website: null,
      wikidataId: 'Q12100416',
    });
  });
});
