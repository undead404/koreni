import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import getVolunteers from '@/app/helpers/get-volunteers';

import VolunteersPage, { getRank } from './page';

// Mock dependencies
vi.mock('@/app/helpers/get-volunteers', () => ({
  default: vi.fn(),
}));

// Mock Link component
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

// Mock CSS modules
vi.mock('./page.module.css', () => ({
  default: {
    container: 'container',
    header: 'header',
    title: 'title',
    subtitle: 'subtitle',
    grid: 'grid',
    card: 'card',
    cardLink: 'cardLink',
    cardHeader: 'cardHeader',
    rankBadge: 'rankBadge',
    arrow: 'arrow',
    name: 'name',
    statsRow: 'statsRow',
    powerValue: 'powerValue',
    powerLabel: 'powerLabel',
    footer: 'footer',
    emptyState: 'emptyState',
    rankLegend: 'rankLegend',
    rankArchivist: 'rankArchivist',
    rankResearcher: 'rankResearcher',
    rankNovice: 'rankNovice',
  },
}));

describe('getRank', () => {
  it('should return correct rank for "Хранитель" (>= 10000)', () => {
    expect(getRank(10_000)?.title).toBe('Хранитель');
    expect(getRank(100_000)?.title).toBe('Хранитель');
  });

  it('should return correct rank for "Архіваріус" (>= 1000)', () => {
    expect(getRank(1000)?.title).toBe('Архіваріус');
    expect(getRank(9999)?.title).toBe('Архіваріус');
  });

  it('should return correct rank for "Упорядник" (>= 100)', () => {
    expect(getRank(100)?.title).toBe('Упорядник');
    expect(getRank(999)?.title).toBe('Упорядник');
  });

  it('should return correct rank for "Писар" (>= 0)', () => {
    expect(getRank(0)?.title).toBe('Писар');
    expect(getRank(99)?.title).toBe('Писар');
  });

  it('should fallback to last rank if power is negative (though unlikely)', () => {
    expect(getRank(-1)?.title).toBe('Писар');
  });
});

describe('VolunteersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render volunteers sorted by power descending', async () => {
    const mockVolunteers = [
      {
        slug: 'novice',
        name: 'Novice User',
        power: 10,
        tables: ['t1'],
      },
      {
        slug: 'legend',
        name: 'Legend User',
        power: 15_000,
        tables: ['t2', 't3'],
      },
      {
        slug: 'archivist',
        name: 'Archivist User',
        power: 2000,
        tables: [],
      },
    ];

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    vi.mocked(getVolunteers).mockResolvedValue(mockVolunteers as any);

    const jsx = await VolunteersPage();
    render(jsx);

    const names = screen
      .getAllByRole('heading', { level: 2 })
      .map((h) => h.textContent);

    // Expect order: Legend (15000) -> Archivist (2000) -> Novice (10)
    expect(names).toEqual(['Legend User', 'Archivist User', 'Novice User']);

    // Check ranks are rendered
    expect(screen.getByText('Хранитель')).toBeDefined();
    expect(screen.getByText('Архіваріус')).toBeDefined();
    expect(screen.getByText('Писар')).toBeDefined();
  });

  it('should handle "Невідомі" user correctly (no rank badge)', async () => {
    const mockVolunteers = [
      {
        slug: 'unknown',
        name: 'Невідомі',
        power: 500,
        tables: ['t1'],
      },
    ];

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    vi.mocked(getVolunteers).mockResolvedValue(mockVolunteers as any);

    const jsx = await VolunteersPage();
    render(jsx);

    expect(screen.getByText('Невідомі')).toBeDefined();
    // Should NOT have rank badge text
    expect(screen.queryByText('Упорядник')).toBeNull();
  });

  it('should render empty state when no volunteers', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    vi.mocked(getVolunteers).mockResolvedValue([] as any);

    const jsx = await VolunteersPage();
    render(jsx);

    expect(
      screen.getByText('Поки що немає активних волонтерів. Станьте першим!'),
    ).toBeDefined();
  });
});
