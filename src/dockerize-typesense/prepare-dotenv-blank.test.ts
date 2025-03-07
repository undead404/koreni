import { copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';

import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { TYPESENSE_PORT } from './config';
import prepareDotenvBlank from './prepare-dotenv-blank';
import writeEnvironmentValues from './write-environment-values';

vi.mock('node:fs');
vi.mock('./write-environment-values');

describe('prepareDotenvBlank', () => {
  const environmentExamplePath = path.resolve('.', '.env.example');
  const environmentPath = path.resolve('.', '.env');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should log that the .env file already exists if it does', () => {
    (existsSync as Mock).mockReturnValue(true);

    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    prepareDotenvBlank();

    expect(existsSync).toHaveBeenCalledWith(environmentPath);
    expect(copyFileSync).not.toHaveBeenCalled();
    expect(writeEnvironmentValues).not.toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith('.env file already exists');

    consoleLogSpy.mockRestore();
  });

  it('should create .env file from .env.example if .env does not exist', () => {
    (existsSync as Mock).mockReturnValue(false);

    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    prepareDotenvBlank();

    expect(existsSync).toHaveBeenCalledWith(environmentPath);
    expect(copyFileSync).toHaveBeenCalledWith(
      environmentExamplePath,
      environmentPath,
    );
    expect(writeEnvironmentValues).toHaveBeenCalledWith({
      NEXT_PUBLIC_TYPESENSE_HOST: 'http://localhost:' + TYPESENSE_PORT,
    });
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '.env file created from .env.example',
    );

    consoleLogSpy.mockRestore();
  });
});
