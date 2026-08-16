import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { type Project } from '../schemata';

import ProjectsList from './projects-list';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('../api/get-projects', () => ({
  default: vi.fn(),
}));

const getProjectsModule = await import('../api/get-projects');
const mockGetProjects = vi.mocked(getProjectsModule.default);

const sonnerModule = await import('sonner');
const mockToast = vi.mocked(sonnerModule.toast);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ProjectsList', () => {
  it('renders a grid of project cards when projects are returned', async () => {
    const mockProjects: Project[] = [
      {
        id: '1',
        title: 'Проєкт А',
        created_at: '2024-01-15T00:00:00Z',
      },
      {
        id: '2',
        title: 'Проєкт Б',
        created_at: '2024-06-01T00:00:00Z',
      },
    ];

    mockGetProjects.mockResolvedValue(mockProjects);

    const { unmount } = render(<ProjectsList />);

    await waitFor(() => {
      const articles = screen.getAllByRole('article');
      expect(articles).toHaveLength(2);
    });

    expect(screen.getByText('Проєкт А')).toBeInTheDocument();
    expect(screen.getByText('Проєкт Б')).toBeInTheDocument();

    const links = screen.getAllByRole('link');
    const projectLinks = links.filter((link) =>
      Boolean(
        link.getAttribute('href')?.includes('/transcribe/workspace?projectId='),
      ),
    );
    expect(projectLinks).toHaveLength(2);
    expect(projectLinks[0]).toHaveAttribute(
      'href',
      '/transcribe/workspace?projectId=1',
    );
    expect(projectLinks[1]).toHaveAttribute(
      'href',
      '/transcribe/workspace?projectId=2',
    );

    // Check for formatted dates
    expect(screen.getByText(/15 січня 2024/)).toBeInTheDocument();
    expect(screen.getByText(/1 червня 2024/)).toBeInTheDocument();

    unmount();
  });

  it('renders the empty state when no projects are returned', async () => {
    mockGetProjects.mockResolvedValue([]);

    const { unmount } = render(<ProjectsList />);

    await waitFor(() => {
      expect(screen.getByText('Немає проєктів')).toBeInTheDocument();
    });

    const articles = screen.queryAllByRole('article');
    expect(articles).toHaveLength(0);

    unmount();
  });

  it('shows an error toast when the API call fails', async () => {
    mockGetProjects.mockRejectedValue(new Error('API Error'));

    const { unmount } = render(<ProjectsList />);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        'Помилка завантаження проєктів',
      );
    });

    const articles = screen.queryAllByRole('article');
    expect(articles).toHaveLength(0);

    unmount();
  });

  it('omits the date element when created_at is an invalid date string', async () => {
    const mockProjects: Project[] = [
      {
        id: '3',
        title: 'Без дати',
        created_at: 'not-a-date',
      },
    ];

    mockGetProjects.mockResolvedValue(mockProjects);

    const { unmount } = render(<ProjectsList />);

    await waitFor(() => {
      expect(screen.getByText('Без дати')).toBeInTheDocument();
    });

    expect(screen.queryByText('Invalid Date')).not.toBeInTheDocument();
    const articles = screen.getAllByRole('article');
    expect(articles).toHaveLength(1);

    unmount();
  });

  it('renders a card with a long title without layout overflow', async () => {
    const longTitle =
      'Це дуже довгий заголовок проєкту, який містить багато символів і повинен правильно розташуватися всередині картки без переповнення або порушення макету. Цей текст спеціально створений для тестування обробки довгих рядків у компоненті.';

    const mockProjects: Project[] = [
      {
        id: '4',
        title: longTitle,
        created_at: '2024-03-10T00:00:00Z',
      },
    ];

    mockGetProjects.mockResolvedValue(mockProjects);

    const { unmount } = render(<ProjectsList />);

    await waitFor(() => {
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    const articles = screen.getAllByRole('article');
    expect(articles).toHaveLength(1);

    unmount();
  });
});
