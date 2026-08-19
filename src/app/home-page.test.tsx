import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

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

vi.mock('./components/comments/comments', () => ({
  default: () => <div data-testid="comments" />,
}));

vi.mock('./components/search', () => ({
  default: () => <div data-testid="search-page" />,
}));

vi.mock('./index-json-ld', () => ({
  default: () => <div data-testid="json-ld" />,
}));

describe('Home Page', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders without links to /account or /transcribe', async () => {
    const Component = await Home();
    render(Component);

    const links = screen.queryAllByRole('link');
    for (const link of links) {
      const href = link.getAttribute('href');
      expect(href).not.toContain('/account');
      expect(href).not.toContain('/transcribe');
    }
  });
});
