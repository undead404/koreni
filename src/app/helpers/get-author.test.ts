import { describe, expect, it } from 'vitest';

import getAuthor from './get-author';

describe('getAuthor', () => {
  it('returns a public person with the consented author name', () => {
    expect(getAuthor({ authorName: 'Chosen Alias' })).toStrictEqual({
      '@type': 'Person',
      name: 'Chosen Alias',
    });
  });

  it('does not expose the contributor email', () => {
    const author = getAuthor({
      authorEmail: 'author@example.com',
      authorName: 'Author Name',
    });

    expect(author).toStrictEqual({
      '@type': 'Person',
      name: 'Author Name',
    });
    expect(JSON.stringify(author)).not.toContain('author@example.com');
    expect(JSON.stringify(author)).not.toContain('mailto:');
  });

  it('returns null when the author name is missing', () => {
    expect(getAuthor({ authorEmail: 'author@example.com' })).toBeNull();
  });
});
