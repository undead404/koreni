import { beforeEach, describe, expect, it, vi } from 'vitest';

import getDefaultValues from './default-values';
import { restoreAuthorIdentity } from './local-storage';

vi.mock('./local-storage', () => ({
  restoreAuthorIdentity: vi.fn(),
}));

describe('getDefaultValues', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const BLANK_VALUES = {
    archiveItems: [],
    authorEmail: '',
    authorGithubUsername: '',
    authorName: '',
    id: '',
    location: '',
    sources: [],
    table: null,
    tableLocale: null,
    title: '',
    yearsRange: [],
  };

  it('returns BLANK_VALUES when nothing is restored and no overrides provided', () => {
    vi.mocked(restoreAuthorIdentity).mockReturnValue(null);
    const result = getDefaultValues();
    expect(result).toEqual(BLANK_VALUES);
  });

  it('merges restored values with BLANK_VALUES', () => {
    vi.mocked(restoreAuthorIdentity).mockReturnValue({
      authorName: 'John Doe',
      authorEmail: 'john@example.com',
    });
    const result = getDefaultValues();
    expect(result).toEqual({
      ...BLANK_VALUES,
      authorName: 'John Doe',
      authorEmail: 'john@example.com',
    });
  });

  it('merges otherDefaultValues over BLANK_VALUES when nothing is restored', () => {
    vi.mocked(restoreAuthorIdentity).mockReturnValue(null);
    const result = getDefaultValues({ title: 'Custom Title' });
    expect(result).toEqual({
      ...BLANK_VALUES,
      title: 'Custom Title',
    });
  });

  it('merges otherDefaultValues over restored values', () => {
    vi.mocked(restoreAuthorIdentity).mockReturnValue({
      authorName: 'John Doe',
      authorEmail: 'john@example.com',
    });
    const result = getDefaultValues({ title: 'Override Title' });
    expect(result).toEqual({
      ...BLANK_VALUES,
      authorName: 'John Doe',
      title: 'Override Title',
    });
  });
});
