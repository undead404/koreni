import { describe, expect, it } from 'vitest';

import { parseBlogArticle } from './blog-content';

const frontMatter = `---
title: Test article
description: A technical note
date: 2026-08-25
author: Test author
draft: false
tags:
  - search
---

# Content
`;

describe('parseBlogArticle', () => {
  it('parses valid front matter and derives the slug', () => {
    expect(parseBlogArticle('test-article.md', frontMatter)).toStrictEqual({
      title: 'Test article',
      description: 'A technical note',
      date: '2026-08-25',
      author: 'Test author',
      draft: false,
      tags: ['search'],
      content: '# Content\n',
      slug: 'test-article',
    });
  });

  it('rejects malformed front matter', () => {
    expect(() => parseBlogArticle('test-article.md', '# Content')).toThrow(
      /missing valid front matter/,
    );
  });

  it('rejects invalid metadata with the source filename', () => {
    expect(() =>
      parseBlogArticle(
        'test-article.md',
        frontMatter.replace('draft: false', 'draft: yes'),
      ),
    ).toThrow(/test-article\.md/);
  });

  it('rejects invalid filenames', () => {
    expect(() => parseBlogArticle('Test Article.md', frontMatter)).toThrow(
      /Invalid blog filename/,
    );
  });

  it('rejects invalid dates', () => {
    expect(() =>
      parseBlogArticle(
        'test-article.md',
        frontMatter.replace('2026-08-25', 'not-a-date'),
      ),
    ).toThrow(/date/);
  });
});
