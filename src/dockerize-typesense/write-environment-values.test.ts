import { beforeEach, describe, expect, it, vi } from 'vitest';

import readEnvironmentFile from './read-environment-file';
import writeEnvironmentValues from './write-environment-values';

const mocks = vi.hoisted(() => ({
  writeFileSync: vi.fn(),
}));

vi.mock('node:fs', () => ({
  writeFileSync: mocks.writeFileSync,
  default: {
    writeFileSync: mocks.writeFileSync,
  },
}));

vi.mock('./read-environment-file');

describe('writeEnvironmentValues', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should write environment values to .env file', () => {
    const oldEnvironment = {
      KEY1: 'value1',
      KEY2: 'value2',
    };

    const newKeys = {
      KEY2: 'new-value2',
      KEY3: 'value3',
    };

    const expectedContent = 'KEY1=value1\nKEY2=new-value2\nKEY3=value3';

    vi.mocked(readEnvironmentFile).mockReturnValue(oldEnvironment);

    writeEnvironmentValues(newKeys);

    expect(readEnvironmentFile).toHaveBeenCalled();
    expect(mocks.writeFileSync).toHaveBeenCalledWith('.env', expectedContent);
  });

  it('should handle empty existing environment file', () => {
    const oldEnvironment = {};

    const newKeys = {
      KEY1: 'value1',
      KEY2: 'value2',
    };

    const expectedContent = 'KEY1=value1\nKEY2=value2';

    vi.mocked(readEnvironmentFile).mockReturnValue(oldEnvironment);

    writeEnvironmentValues(newKeys);

    expect(readEnvironmentFile).toHaveBeenCalled();
    expect(mocks.writeFileSync).toHaveBeenCalledWith('.env', expectedContent);
  });

  it('should overwrite existing keys with new values', () => {
    const oldEnvironment = {
      KEY1: 'value1',
    };

    const newKeys = {
      KEY1: 'new-value1',
    };

    const expectedContent = 'KEY1=new-value1';

    vi.mocked(readEnvironmentFile).mockReturnValue(oldEnvironment);

    writeEnvironmentValues(newKeys);

    expect(readEnvironmentFile).toHaveBeenCalled();
    expect(mocks.writeFileSync).toHaveBeenCalledWith('.env', expectedContent);
  });
});
