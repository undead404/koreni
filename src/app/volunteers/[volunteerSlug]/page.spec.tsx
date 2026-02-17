import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import getVolunteers from '@/app/helpers/get-volunteers';

import VolunteerPage, { generateMetadata, getRank } from './page';

// Mock dependencies
vi.mock('@/app/helpers/get-volunteers', () => ({
  default: vi.fn(),
}));

vi.mock('@/app/environment', () => ({
  default: {
    NEXT_PUBLIC_SITE: 'https://koreni.test',
  },
}));

vi.mock('next/head', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}));

// Mock sub-components
vi.mock('@/app/components/comments-wrapped', () => ({
  default: () => <div data-testid="comments-wrapped" />,
}));

vi.mock('@/app/components/contact-gate', () => ({
  default: ({ contact }: { contact: string }) => <span>{contact}</span>,
}));

vi.mock('@/app/tables/table-json-ld', () => ({
  default: () => <script data-testid="json-ld" />,
}));

// Mock CSS modules
vi.mock('./page.module.css', () => ({
  default: {
    container: 'container',
    header: 'header',
    headerTop: 'headerTop',
    backLink: 'backLink',
    rankBadge: 'rankBadge',
    rankLegend: 'rankLegend',
    rankArchivist: 'rankArchivist',
    rankRegistrar: 'rankRegistrar',
    rankScribe: 'rankScribe',
    name: 'name',
    contact: 'contact',
    stats: 'stats',
    statItem: 'statItem',
    statValue: 'statValue',
    statLabel: 'statLabel',
    divider: 'divider',
    sectionTitle: 'sectionTitle',
    list: 'list',
    listItem: 'listItem',
    tableLink: 'tableLink',
    tableMeta: 'tableMeta',
    commentsWrapper: 'commentsWrapper',
  },
}));

describe('getRank (Volunteer Profile)', () => {
  it('should return correct rank for "Хранитель" (>= 10000)', () => {
    expect(getRank(10_000)?.title).toBe('Хранитель');
  });

  it('should return correct rank for "Архіваріус" (>= 1000)', () => {
    expect(getRank(1000)?.title).toBe('Архіваріус');
  });

  it('should return correct rank for "Реєстратор" (>= 100)', () => {
    expect(getRank(100)?.title).toBe('Реєстратор');
  });

  it('should return correct rank for "Писар" (>= 0)', () => {
    expect(getRank(0)?.title).toBe('Писар');
  });
});

describe('VolunteerPage', () => {
  const mockVolunteers = [
    {
      slug: 'test-volunteer',
      name: 'Test Volunteer',
      power: 1500,
      emails: ['test@example.com'],
      tables: [
        {
          id: 'table-1',
          title: 'Table 1',
          size: 100,
        },
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    vi.mocked(getVolunteers).mockResolvedValue(mockVolunteers as any);
  });

  it('should render volunteer profile correctly', async () => {
    const parameters = Promise.resolve({ volunteerSlug: 'test-volunteer' });
    const jsx = await VolunteerPage({ params: parameters });
    render(jsx);

    expect(screen.getByText('Test Volunteer')).toBeDefined();
    expect(screen.getByText('Архіваріус')).toBeDefined(); // Power 1500
    expect(screen.getByText('1 500')).toBeDefined(); // Power
    expect(screen.getByText('1')).toBeDefined(); // Tables count
    expect(screen.getByText('Table 1')).toBeDefined();
    expect(screen.getByText('test@example.com')).toBeDefined();
  });

  it('should call notFound if volunteer does not exist', async () => {
    const { notFound } = await import('next/navigation');
    const parameters = Promise.resolve({ volunteerSlug: 'non-existent' });

    try {
      await VolunteerPage({ params: parameters });
    } catch {
      // ignore
    }

    expect(notFound).toHaveBeenCalled();
  });
});

describe('generateMetadata', () => {
  const mockVolunteers = [
    {
      slug: 'test-volunteer',
      name: 'Test Volunteer',
      power: 1500,
      tables: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    vi.mocked(getVolunteers).mockResolvedValue(mockVolunteers as any);
  });

  it('should generate correct metadata for existing volunteer', async () => {
    const parameters = Promise.resolve({ volunteerSlug: 'test-volunteer' });
    const metadata = await generateMetadata({ params: parameters });

    expect(metadata.title).toBe('Test Volunteer | Волонтер Корені');
    expect(metadata.description).toContain('Test Volunteer');
    expect(metadata.description).toContain('1500 записів');
  });

  it('should return fallback title for non-existent volunteer', async () => {
    const parameters = Promise.resolve({ volunteerSlug: 'non-existent' });
    const metadata = await generateMetadata({ params: parameters });

    expect(metadata.title).toBe('Волонтер не знайдений');
  });
});
