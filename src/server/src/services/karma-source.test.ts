import { describe, expect, it } from 'vitest';

import { KarmaSourceUnavailableError } from './karma-source.js';

describe('karma-source', () => {
  it('exposes a stable error for unavailable external data', () => {
    const error = new KarmaSourceUnavailableError();

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('KarmaSourceUnavailableError');
    expect(error.message).toBe('Karma source unavailable');
  });
});
