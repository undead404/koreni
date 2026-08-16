import { cleanup, render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import getArchiveSources, {
  type ArchiveSource,
} from '@/shared/get-archive-sources';

import SourcesPage from './page';

vi.mock('@/shared/get-archive-sources', () => ({
  default: vi.fn(),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('./page.module.css', () => ({
  default: new Proxy({}, { get: (_t, p) => String(p) }),
}));

vi.mock('./sources-filter.module.css', () => ({
  default: new Proxy({}, { get: (_t, p) => String(p) }),
}));

const buildSource = (
  overrides: Partial<ArchiveSource> = {},
): ArchiveSource => ({
  archive: 'ДАКО',
  fond: '384',
  opys: '10',
  sprava: '242',
  raw: 'ДАКО-384-10-242',
  key: 'ДАКО|384|10|242',
  tables: [{ id: 't1', title: 'Table 1' }],
  yearsRange: [1900],
  ...overrides,
});

describe('SourcesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders one row per source with parsed fields and table links', async () => {
    vi.mocked(getArchiveSources).mockResolvedValue([
      buildSource({
        tables: [
          { id: 't1', title: 'Table 1' },
          { id: 't2', title: 'Table 2' },
        ],
        yearsRange: [1900, 1910],
      }),
    ]);

    const jsx = await SourcesPage();
    render(jsx);

    const row = screen.getByText('242').closest('tr') as HTMLTableRowElement;
    const cells = within(row).getAllByRole('cell');
    expect(cells[0].textContent).toBe('ДАКО');
    expect(cells[1].textContent).toBe('384');
    expect(cells[2].textContent).toBe('10');
    expect(cells[3].textContent).toBe('242');
    expect(cells[4].textContent).toBe('1900–1910');

    const link1 = within(row).getByRole('link', { name: 'Table 1' });
    expect(link1.getAttribute('href')).toBe('/t1/1/');
    expect(within(row).getByRole('link', { name: 'Table 2' })).toBeDefined();
  });

  it('collapses tables into <details> when there are 5 or more', async () => {
    vi.mocked(getArchiveSources).mockResolvedValue([
      buildSource({
        tables: Array.from({ length: 6 }, (_, index) => ({
          id: `t${index}`,
          title: `Table ${index}`,
        })),
      }),
    ]);

    const jsx = await SourcesPage();
    render(jsx);

    expect(screen.getByText('6 таблиць')).toBeDefined();
  });

  it('uses the correct Ukrainian plural form for large table counts', async () => {
    vi.mocked(getArchiveSources).mockResolvedValue([
      buildSource({
        tables: Array.from({ length: 21 }, (_, index) => ({
          id: `t${index}`,
          title: `Table ${index}`,
        })),
      }),
    ]);

    const jsx = await SourcesPage();
    render(jsx);

    expect(screen.getByText('21 таблиця')).toBeDefined();
  });

  it('renders unparsed sources with raw text spanning the code columns', async () => {
    vi.mocked(getArchiveSources).mockResolvedValue([
      buildSource({
        archive: '',
        fond: '',
        opys: '',
        sprava: '',
        raw: 'AGAD 298/151',
        key: 'AGAD 298/151',
      }),
    ]);

    const jsx = await SourcesPage();
    render(jsx);

    const rawCell = screen.getByText('AGAD 298/151');
    expect(rawCell.tagName).toBe('TD');
    expect(rawCell.getAttribute('colspan')).toBe('4');
  });

  it('renders "Інші джерела" option in the archive select when unparsed sources exist', async () => {
    vi.mocked(getArchiveSources).mockResolvedValue([
      buildSource(),
      buildSource({
        archive: '',
        fond: '',
        opys: '',
        sprava: '',
        raw: 'AGAD 298/151',
        key: 'AGAD 298/151',
      }),
    ]);

    const jsx = await SourcesPage();
    render(jsx);

    const select = screen.getByLabelText('Архів');
    expect(
      within(select).getByRole('option', { name: 'Інші джерела' }),
    ).toBeDefined();
  });

  it('omits "Інші джерела" option when all sources are parsed', async () => {
    vi.mocked(getArchiveSources).mockResolvedValue([buildSource()]);

    const jsx = await SourcesPage();
    render(jsx);

    expect(screen.queryByText('Інші джерела')).toBeNull();
  });

  it('lists each unique archive once in the select', async () => {
    vi.mocked(getArchiveSources).mockResolvedValue([
      buildSource({ archive: 'ДАКО', key: 'a' }),
      buildSource({ archive: 'ДАКО', key: 'b' }),
      buildSource({ archive: 'ДАЖО', key: 'c' }),
    ]);

    const jsx = await SourcesPage();
    render(jsx);

    const select = screen.getByLabelText('Архів');
    expect(
      within(select).getAllByRole('option', { name: 'ДАКО' }),
    ).toHaveLength(1);
    expect(
      within(select).getAllByRole('option', { name: 'ДАЖО' }),
    ).toHaveLength(1);
  });
});
