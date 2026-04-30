import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { IndexationTable } from '@/shared/schemas/indexation-table';

import TableContent from './table-content';

vi.mock('@/app/environment', () => ({
  default: {
    NEXT_PUBLIC_SITE: 'https://koreni.test',
  },
}));
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock('@/app/components/archive-item', () => ({
  default: () => <div data-testid="archive-item" />,
}));
vi.mock('@/app/services/map-points', () => ({
  default: [],
}));
vi.mock('@/app/components/details', () => ({
  default: ({
    children,
    summary,
  }: {
    children: ReactNode;
    summary: ReactNode;
  }) => (
    <div data-testid="details">
      {summary}
      {children}
    </div>
  ),
}));
vi.mock('@/app/components/index-table', () => ({
  default: () => <div data-testid="index-table" />,
}));
vi.mock('@/app/components/map-wrapper', () => ({
  default: () => <div data-testid="map-wrapper" />,
}));
vi.mock('@/app/components/pagination', () => ({
  default: () => <div data-testid="pagination" />,
}));
vi.mock('@/app/components/source-link', () => ({
  default: ({ href }: { href: string }) => <a href={href}>{href}</a>,
}));
vi.mock('@/app/components/comments/comments', () => ({
  default: () => <div data-testid="comments" />,
}));
vi.mock('@/app/helpers/slugify-ukrainian', () => ({
  default: (text: string) => text,
}));

const mockTableMetadata: IndexationTable = {
  date: new Date('2023-01-01'),
  id: 'table1',
  title: 'Test Table',
  authorName: 'Test Author',
  sources: ['http://example.com'],
  yearsRange: [1900, 1910],
  archiveItems: ['Item 1', 'Item 2'],
  location: [50, 30] as [number, number],
  tableFilePath: 'public/csv/table1.csv',
  tableLocale: 'uk' as const,
  size: 100,
};

const mockTableData = [{ id: '1', name: 'Row 1' }];

describe('TableContent', () => {
  it('renders table content correctly', () => {
    render(
      <TableContent
        tableMetadata={mockTableMetadata}
        tableData={mockTableData}
        page={1}
        tableId="table1"
        totalRecords={100}
        jsonLd={null}
      />,
    );

    expect(screen.getByText('Test Table')).toBeInTheDocument();
    expect(screen.getByText(/Test Author/)).toBeInTheDocument();
    expect(screen.getByText('http://example.com')).toBeInTheDocument();
    expect(screen.getByText(/1900-1910/)).toBeInTheDocument();
    expect(screen.getAllByTestId('archive-item')).toHaveLength(2);
    expect(screen.getByTestId('map-wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('pagination')).toBeInTheDocument();
    expect(screen.getByTestId('index-table')).toBeInTheDocument();
    expect(screen.getByTestId('comments')).toBeInTheDocument();
  });

  it('renders jsonLd script when provided', () => {
    const jsonLd = '{"@context": "https://schema.org"}';
    const { container } = render(
      <TableContent
        tableMetadata={mockTableMetadata}
        tableData={mockTableData}
        page={1}
        tableId="table1"
        totalRecords={100}
        jsonLd={jsonLd}
      />,
    );

    const script = container.querySelector(
      'script[type="application/ld+json"]',
    );
    expect(script).toBeInTheDocument();
    expect(script?.textContent).toBe(jsonLd);
  });
});
