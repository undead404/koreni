import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, Mock, vi } from 'vitest';

import getProjects from '../api/get-projects';

import ProjectsList from './projects-list';

vi.mock('../api/get-projects', () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe('ProjectsList', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders a list of projects with links', async () => {
    const mockProjects = [
      {
        id: 'proj-1',
        title: 'Project One',
        created_at: '2026-05-27T00:00:00Z',
      },
      {
        id: 'proj-2',
        title: 'Project Two',
        created_at: '2026-05-27T00:00:00Z',
      },
    ];
    (getProjects as Mock).mockResolvedValue(mockProjects);

    const { getByText } = render(<ProjectsList />);

    await waitFor(() => {
      expect(getByText('Project One')).toBeInTheDocument();
      expect(getByText('Project Two')).toBeInTheDocument();
    });

    const link1 = getByText('Project One');
    expect(link1.tagName).toBe('A');
    expect(link1).toHaveAttribute(
      'href',
      '/transcribe/workspace?projectId=proj-1',
    );

    const link2 = getByText('Project Two');
    expect(link2.tagName).toBe('A');
    expect(link2).toHaveAttribute(
      'href',
      '/transcribe/workspace?projectId=proj-2',
    );
  });

  it('renders "No projects" when there are no projects', async () => {
    (getProjects as Mock).mockResolvedValue([]);

    const { getByText } = render(<ProjectsList />);

    await waitFor(() => {
      expect(getByText('No projects')).toBeInTheDocument();
    });
  });
});
