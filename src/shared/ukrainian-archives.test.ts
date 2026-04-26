import { describe, expect, it, vi } from 'vitest';

vi.mock('node:fs', () => {
  const readFileSync = vi.fn(() => 'Archive 1\nArchive 2\n\nArchive 3\n');
  return {
    readFileSync,
    default: { readFileSync },
  };
});

import UKRAINIAN_ARCHIVES from './ukrainian-archives';

describe('UKRAINIAN_ARCHIVES', () => {
  it('should read and parse the archives list correctly, filtering out empty lines', () => {
    expect(UKRAINIAN_ARCHIVES).toEqual(['Archive 1', 'Archive 2', 'Archive 3']);
  });
});
