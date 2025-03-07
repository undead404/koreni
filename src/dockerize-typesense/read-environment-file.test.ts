import { readFileSync } from 'node:fs';

import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import readEnvironmentFile from './read-environment-file';

vi.mock('node:fs');

describe('readEnvironmentFile', () => {
  const mockEnvironmentContent = `
    KEY1=value1
    KEY2=value2
    KEY3=value3
  `;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should read and parse the .env file correctly', () => {
    (readFileSync as Mock).mockReturnValue(mockEnvironmentContent);

    const result = readEnvironmentFile();

    expect(readFileSync).toHaveBeenCalledWith('.env');
    expect(result).toEqual({
      KEY1: 'value1',
      KEY2: 'value2',
      KEY3: 'value3',
    });
  });

  it('should throw an error if the .env file contains an invalid line', () => {
    const invalidEnvironmentContent = `
      KEY1=value1
      INVALID_LINE
      KEY2=value2
    `;
    (readFileSync as Mock).mockReturnValue(invalidEnvironmentContent);

    expect(() => readEnvironmentFile()).toThrow('Invalid .env');
  });

  it('should ignore empty lines in the .env file', () => {
    const environmentContentWithEmptyLines = `
      KEY1=value1

      KEY2=value2

      KEY3=value3
    `;
    (readFileSync as Mock).mockReturnValue(environmentContentWithEmptyLines);

    const result = readEnvironmentFile();

    expect(result).toEqual({
      KEY1: 'value1',
      KEY2: 'value2',
      KEY3: 'value3',
    });
  });
});
