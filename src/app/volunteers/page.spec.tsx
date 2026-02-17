import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import getVolunteers from '@/app/helpers/get-volunteers';

import VolunteersPage from './page';

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
    expect(screen.queryByText('Реєстратор')).toBeNull();
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
