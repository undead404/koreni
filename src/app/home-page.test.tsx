import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import Home from './page';

vi.mock('@koreni/shared/get-tables-metadata', () => ({
  default: vi.fn().mockResolvedValue([
    {
      authorName: 'Test Author',
      date: new Date('2026-01-01'),
      id: 'test-table',
      size: 10,
    },
  ]),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('./components/comments/comments', () => ({
  default: () => <div data-testid="comments" />,
}));

vi.mock('./components/home-discover', () => ({
  default: () => <div data-testid="discover" />,
}));

vi.mock('./components/search', () => ({
  default: () => <div data-testid="search-page" />,
}));

vi.mock('./index-json-ld', () => ({
  default: () => <div data-testid="json-ld" />,
}));

describe('Home Page', () => {
  it('renders search, discovery, and comments in order and keeps public routes', async () => {
    const page = await Home();
    const markup = renderToStaticMarkup(page);

    const searchPosition = markup.indexOf('data-testid="search-page"');
    const discoverPosition = markup.indexOf('data-testid="discover"');
    const commentsPosition = markup.indexOf('data-testid="comments"');

    expect(searchPosition).toBeGreaterThanOrEqual(0);
    expect(discoverPosition).toBeGreaterThan(searchPosition);
    expect(commentsPosition).toBeGreaterThan(discoverPosition);
    expect(markup).toContain('<a href="/tables">1 різної таблиці</a>');
    expect(markup).not.toContain('/account');
    expect(markup).not.toContain('/transcribe');
    expect(markup).toContain('data-testid="json-ld"');
  });
});
