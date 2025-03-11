import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ArchiveItem from './archive-item';

vi.mock('@/shared/ukrainian-archives', () => ({
  default: ['ua1', 'ua2'],
}));

describe('ArchiveItem', () => {
  it('should render an item with a title when the archive item is not blacklisted', () => {
    render(<ArchiveItem archiveItem="unknownArchiveItem" />);

    const listItem = screen.getByText('unknownArchiveItem');
    expect(listItem).toBeInTheDocument();
    expect(listItem).toHaveAttribute(
      'title',
      'Ця справа походить з невідомого архіву',
    );
  });

  it('should render an item with a search link when the archive item is blacklisted', () => {
    render(<ArchiveItem archiveItem="ua1-item" />);

    const listItem = screen.getByText('ua1-item');
    expect(listItem).toBeInTheDocument();

    const link = screen.getByTitle(
      'Шукати справу ua1-item в Качиному інспекторі',
    );
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute(
      'href',
      'https://inspector.duckarchive.com/search?q=ua1-item',
    );
    expect(link).toHaveAttribute('target', '_blank');

    expect(link.children[0]).not.toBeFalsy();
  });
});
