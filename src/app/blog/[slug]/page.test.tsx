import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import BlogArticlePage, {
  generateMetadata,
  generateStaticParams,
} from './page';

vi.mock('../blog-content', () => ({
  getBlogArticle: vi.fn().mockResolvedValue({
    slug: 'test-article',
    title: 'Test article',
    description: 'A technical note',
    date: '2026-08-25',
    author: 'Test author',
    draft: false,
    tags: ['search'],
    content: '# Rendered content\n\n```ts\nconst value = 1;\n```',
  }),
  getBlogArticles: vi.fn().mockResolvedValue([
    {
      slug: 'test-article',
      title: 'Test article',
      description: 'A technical note',
      date: '2026-08-25',
      author: 'Test author',
      draft: false,
      content: '',
    },
  ]),
}));

vi.mock('@/app/components/comments/comments', () => ({
  default: () => <div data-testid="comments" />,
}));

describe('BlogArticlePage', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders article content, metadata, tags, and comments', async () => {
    render(
      await BlogArticlePage({
        params: Promise.resolve({ slug: 'test-article' }),
      }),
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Test article' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Test author/)).toBeInTheDocument();
    expect(screen.getByText('Rendered content')).toBeInTheDocument();
    expect(screen.getByText('const value = 1;')).toBeInTheDocument();
    expect(screen.getByText('search')).toBeInTheDocument();
    expect(screen.getByTestId('comments')).toBeInTheDocument();
  });

  it('generates published article params and metadata', async () => {
    expect(await generateStaticParams()).toStrictEqual([
      { slug: 'test-article' },
    ]);
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: 'test-article' }),
    });
    expect(metadata.title).toBe('Test article');
    expect(metadata.alternates?.canonical).toBe('/blog/test-article/');
    expect(metadata.openGraph).toMatchObject({ type: 'article' });
  });
});
