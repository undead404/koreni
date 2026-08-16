import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  extractContributionFiles,
  validateFilenameIdConsistency,
  validateTableFilePathConsistency,
} from './index';

describe('validate-data-contribution', () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit(1)');
    });
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });

  describe('extractContributionFiles', () => {
    it('returns yamlPath and csvPath when exactly 1 YAML and 1 CSV are present', () => {
      const changedFiles = [
        'data/records/1897-Foo.yaml',
        'data/csv/1897-Foo.csv',
      ];

      const result = extractContributionFiles(changedFiles);

      expect(result.yamlPath).toBe('data/records/1897-Foo.yaml');
      expect(result.csvPath).toBe('data/csv/1897-Foo.csv');
    });

    it('exits 1 when 0 YAML files are in the diff', () => {
      const changedFiles = ['data/csv/1897-Foo.csv', 'data/README.md'];

      expect(() => extractContributionFiles(changedFiles)).toThrow(
        'process.exit(1)',
      );
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Expected exactly 1 YAML file'),
      );
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('found 0'));
    });

    it('exits 1 when 2+ YAML files are in the diff', () => {
      const changedFiles = [
        'data/records/1897-Foo.yaml',
        'data/records/1897-Bar.yaml',
        'data/csv/1897-Foo.csv',
      ];

      expect(() => extractContributionFiles(changedFiles)).toThrow(
        'process.exit(1)',
      );
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Expected exactly 1 YAML file'),
      );
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('found 2'));
    });

    it('exits 1 when 0 CSV files are in the diff', () => {
      const changedFiles = ['data/records/1897-Foo.yaml', 'data/README.md'];

      expect(() => extractContributionFiles(changedFiles)).toThrow(
        'process.exit(1)',
      );
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Expected exactly 1 CSV file'),
      );
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('found 0'));
    });

    it('exits 1 when 2+ CSV files are in the diff', () => {
      const changedFiles = [
        'data/records/1897-Foo.yaml',
        'data/csv/1897-Foo.csv',
        'data/csv/1897-Bar.csv',
      ];

      expect(() => extractContributionFiles(changedFiles)).toThrow(
        'process.exit(1)',
      );
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Expected exactly 1 CSV file'),
      );
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('found 2'));
    });

    it('error message includes the list of actual changed files', () => {
      const changedFiles = ['data/README.md', 'data/ukrainian_archives.txt'];

      expect(() => extractContributionFiles(changedFiles)).toThrow(
        'process.exit(1)',
      );
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('data/README.md'),
      );
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('data/ukrainian_archives.txt'),
      );
    });

    it('ignores non-data files when counting YAMLs and CSVs', () => {
      const changedFiles = [
        'data/records/1897-Foo.yaml',
        'data/csv/1897-Foo.csv',
        'data/README.md',
        'data/ukrainian_archives.txt',
      ];

      const result = extractContributionFiles(changedFiles);

      expect(result.yamlPath).toBe('data/records/1897-Foo.yaml');
      expect(result.csvPath).toBe('data/csv/1897-Foo.csv');
    });
  });

  describe('validateFilenameIdConsistency', () => {
    it('returns ok when filename matches id exactly', () => {
      expect(() => {
        validateFilenameIdConsistency('data/records/1897-Foo.yaml', '1897-Foo');
      }).not.toThrow();
    });

    it('returns ok when filename matches id case-insensitively', () => {
      expect(() => {
        validateFilenameIdConsistency('data/records/1897-foo.yaml', '1897-FOO');
      }).not.toThrow();
    });

    it('exits 1 when filename does not match id', () => {
      expect(() => {
        validateFilenameIdConsistency('data/records/1897-Foo.yaml', '1897-Bar');
      }).toThrow('process.exit(1)');
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Filename mismatch'),
      );
    });

    it('error message names both the filename and the id value', () => {
      expect(() => {
        validateFilenameIdConsistency('data/records/1897-Foo.yaml', '1897-Bar');
      }).toThrow('process.exit(1)');
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('1897-Foo.yaml'),
      );
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('1897-Bar'),
      );
    });

    it('error message suggests the correct filename to use', () => {
      expect(() => {
        validateFilenameIdConsistency('data/records/1897-Foo.yaml', '1897-Bar');
      }).toThrow('process.exit(1)');
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('1897-Bar.yaml'),
      );
    });

    it('handles complex ids with special characters', () => {
      expect(() => {
        validateFilenameIdConsistency(
          'data/records/DAKhmO-315-1-8330-Brailiv.yaml',
          'DAKhmO-315-1-8330-Brailiv',
        );
      }).not.toThrow();
    });
  });

  describe('validateTableFilePathConsistency', () => {
    it('returns ok when declaredPath exactly equals contributedCsvPath', () => {
      expect(() => {
        validateTableFilePathConsistency(
          'data/csv/1897-Foo.csv',
          'data/csv/1897-Foo.csv',
        );
      }).not.toThrow();
    });

    it('exits 1 when paths differ by case', () => {
      expect(() => {
        validateTableFilePathConsistency(
          'data/csv/1897-Foo.csv',
          'data/csv/1897-foo.csv',
        );
      }).toThrow('process.exit(1)');
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('tableFilePath mismatch'),
      );
    });

    it('exits 1 when paths differ entirely', () => {
      expect(() => {
        validateTableFilePathConsistency(
          'data/csv/1897-Foo.csv',
          'data/csv/1897-Bar.csv',
        );
      }).toThrow('process.exit(1)');
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('tableFilePath mismatch'),
      );
    });

    it('error message names both the declared path and the contributed path', () => {
      expect(() => {
        validateTableFilePathConsistency(
          'data/csv/1897-Foo.csv',
          'data/csv/1897-Bar.csv',
        );
      }).toThrow('process.exit(1)');
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('data/csv/1897-Foo.csv'),
      );
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('data/csv/1897-Bar.csv'),
      );
    });

    it('is case-sensitive (Linux filesystem)', () => {
      // This should NOT throw because the paths are identical
      expect(() => {
        validateTableFilePathConsistency(
          'data/csv/1897-Foo.csv',
          'data/csv/1897-Foo.csv',
        );
      }).not.toThrow();

      // This SHOULD throw because of case difference
      expect(() => {
        validateTableFilePathConsistency(
          'data/csv/1897-Foo.csv',
          'data/csv/1897-foo.csv',
        );
      }).toThrow('process.exit(1)');
    });
  });
});
