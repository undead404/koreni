import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import getProjectImages from '../api/get-project-images';

import TranscribeProjectPage from './page';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock('../api/get-project-images', () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe('TranscribeProjectPage', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as Mock).mockReturnValue({
      push: mockPush,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('redirects to /transcribe if projectId is missing', async () => {
    (useSearchParams as Mock).mockReturnValue({
      get: vi.fn().mockReturnValue(null),
    });

    render(<TranscribeProjectPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/transcribe');
    });
  });

  it('redirects to /transcribe if projectId is invalid', async () => {
    (useSearchParams as Mock).mockReturnValue({
      get: vi.fn().mockReturnValue('invalid_id_with_special_#'),
    });

    render(<TranscribeProjectPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/transcribe');
    });
  });

  it('redirects to /transcribe/project/?projectId=[projectId] if images list is empty', async () => {
    (useSearchParams as Mock).mockReturnValue({
      get: vi.fn().mockReturnValue('project-123'),
    });
    (getProjectImages as Mock).mockResolvedValue([]);

    render(<TranscribeProjectPage />);

    await waitFor(() => {
      expect(getProjectImages).toHaveBeenCalledWith(
        'project-123',
        expect.any(AbortSignal),
      );
      expect(mockPush).toHaveBeenCalledWith(
        '/transcribe/project/?projectId=project-123',
      );
    });
  });

  it('renders success state if images list is not empty', async () => {
    (useSearchParams as Mock).mockReturnValue({
      get: vi.fn().mockReturnValue('project-123'),
    });
    const mockImages = [
      {
        id: 'img-1',
        projectId: 'project-123',
        storageKey: 'key-1',
        pageSequence: 1,
      },
    ];
    (getProjectImages as Mock).mockResolvedValue(mockImages);

    render(<TranscribeProjectPage />);

    await waitFor(() => {
      expect(getProjectImages).toHaveBeenCalledWith(
        'project-123',
        expect.any(AbortSignal),
      );
      expect(
        screen.getByText('Готовність до транскрибування (1 зображень)'),
      ).toBeInTheDocument();
    });
  });

  it('handles API call error gracefully and shows a toast', async () => {
    (useSearchParams as Mock).mockReturnValue({
      get: vi.fn().mockReturnValue('project-123'),
    });
    (getProjectImages as Mock).mockRejectedValue(new Error('API failure'));

    render(<TranscribeProjectPage />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load project images');
      expect(
        screen.getByText('Failed to load project images'),
      ).toBeInTheDocument();
    });
  });

  it('prevents race conditions if projectId changes while a request is in flight', async () => {
    let resolveFirst!: (value: unknown) => void;
    const firstPromise = new Promise((resolve) => {
      resolveFirst = resolve;
    });

    (getProjectImages as Mock).mockImplementation((projId) => {
      if (projId === 'project-old') {
        return firstPromise;
      }
      return Promise.resolve([
        {
          id: 'img-new',
          projectId: 'project-new',
          storageKey: 'key-new',
          pageSequence: 1,
        },
      ]);
    });

    let currentProjectId = 'project-old';
    (useSearchParams as Mock).mockImplementation(() => ({
      get: () => currentProjectId,
    }));

    const { rerender } = render(<TranscribeProjectPage />);

    await waitFor(() => {
      expect(getProjectImages).toHaveBeenCalledWith(
        'project-old',
        expect.any(AbortSignal),
      );
    });

    // Change query param and trigger rerender
    currentProjectId = 'project-new';
    rerender(<TranscribeProjectPage />);

    await waitFor(() => {
      expect(getProjectImages).toHaveBeenCalledWith(
        'project-new',
        expect.any(AbortSignal),
      );
    });

    // Resolve the first (old) request, which should be ignored because it is aborted
    resolveFirst([]);

    await waitFor(() => {
      expect(
        screen.getByText('Готовність до транскрибування (1 зображень)'),
      ).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalledWith(
        '/transcribe/project/?projectId=project-old',
      );
    });
  });
});
