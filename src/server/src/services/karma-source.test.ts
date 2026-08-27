import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../environment.js', () => ({
  default: {
    GITHUB_REPO: 'owner/repo',
    GITHUB_TOKEN: 'token',
    KARMA_DATA_ROOT: undefined,
  },
}));

import {
  KarmaSourceUnavailableError,
  resolveDevelopmentDataRoot,
} from './karma-source.js';

describe('karma-source', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exposes a stable error for unavailable external data', () => {
    const error = new KarmaSourceUnavailableError();

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('KarmaSourceUnavailableError');
    expect(error.message).toBe('Karma source unavailable');
  });

  it('resolves repository data from the backend working directory', async () => {
    vi.spyOn(process, 'cwd').mockReturnValue('/repository/src/server');

    await expect(resolveDevelopmentDataRoot()).resolves.toBe(
      '/repository/data',
    );
  });
});
