import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import BlogPage, { metadata } from './page';

vi.mock('./blog-content', () => ({
  getBlogArticles: vi.fn().mockResolvedValue([
    {
      slug: 'test-article',
      title: 'Test article',
      description: 'A technical note',
      date: '2026-08-25',
      author: 'Test author',
      draft: false,
      tags: ['search'],
      content: '',
    },
  ]),
}));

describe('BlogPage', () => {
  afterEach(() => {
    cleanup();
  });

  it('has blog metadata', () => {
    expect(metadata.title).toBe('Блог');
    expect(metadata.alternates?.canonical).toBe('/blog/');
  });

  it('renders published article summaries', async () => {
    render(await BlogPage());

    expect(
      screen.getByRole('heading', { level: 1, name: 'Блог' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Test article' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Test article' })).toHaveAttribute(
      'href',
      '/blog/test-article',
    );
    expect(screen.getByText('A technical note')).toBeInTheDocument();
    expect(screen.getByText('search')).toBeInTheDocument();
  });
});
