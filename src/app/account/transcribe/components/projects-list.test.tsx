import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import requestApi from '@/app/services/api';

import ProjectsList from './projects-list';

vi.mock('@/app/services/api', () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}));

describe('ProjectsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requestApi).mockResolvedValue({
      json: () =>
        Promise.resolve({
          projects: [
            {
              created_at: '2026-01-01',
              id: 'project-123',
              title: 'Mock Project',
            },
          ],
        }),
    } as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('links projects to the canonical project page', async () => {
    render(<ProjectsList />);

    const projectLink = await waitFor(() =>
      screen.getByRole('link', { name: 'Mock Project' }),
    );

    expect([
      '/account/transcribe/project?projectId=project-123',
      '/account/transcribe/project/?projectId=project-123',
    ]).toContain(projectLink.getAttribute('href'));
  });
});
