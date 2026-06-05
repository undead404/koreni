import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import getProject from '../api/get-project';
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

vi.mock('../api/get-project', () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

let uuidCounter = 0;
Object.defineProperty(globalThis.crypto, 'randomUUID', {
  value: vi.fn(() => `test-uuid-${++uuidCounter}`),
});

describe('TranscribeProjectPage Integration', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as Mock).mockReturnValue({
      push: mockPush,
    });
    (getProject as Mock).mockResolvedValue({
      success: true,
      project: {
        tableLocale: 'uk',
      },
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

  it('redirects to /transcribe/project/?projectId=[projectId] if images list is empty', async () => {
    (useSearchParams as Mock).mockReturnValue({
      get: vi.fn().mockReturnValue('project-123'),
    });
    (getProjectImages as Mock).mockResolvedValue([]);

    render(<TranscribeProjectPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        '/transcribe/project/?projectId=project-123',
      );
    });
  });

  it('renders split panel workspace if images list is not empty', async () => {
    (useSearchParams as Mock).mockReturnValue({
      get: vi.fn().mockReturnValue('project-123'),
    });
    const mockImages = [
      {
        id: 'img-1',
        projectId: 'project-123',
        storageKey: 'key-1.jpg',
        url: 'https://example.com/key-1.jpg',
        pageSequence: 1,
        pageName: '12',
      },
    ];
    (getProjectImages as Mock).mockResolvedValue(mockImages);

    render(<TranscribeProjectPage />);

    await waitFor(() => {
      // Check for elements that confirm both panels are rendered
      expect(screen.getByAltText('12')).toBeInTheDocument();
      expect(screen.getByText('Транскрипція')).toBeInTheDocument();
    });
  });

  it('handles API call error gracefully', async () => {
    (useSearchParams as Mock).mockReturnValue({
      get: vi.fn().mockReturnValue('project-123'),
    });
    (getProjectImages as Mock).mockRejectedValue(new Error('API failure'));

    render(<TranscribeProjectPage />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load project data');
      expect(
        screen.getByText('Failed to load project data'),
      ).toBeInTheDocument();
    });
  });

  it('shows announcement when pageName is missing', async () => {
    (useSearchParams as Mock).mockReturnValue({
      get: vi.fn().mockReturnValue('project-123'),
    });
    (getProjectImages as Mock).mockResolvedValue([
      {
        id: '1',
        storageKey: 'k',
        url: 'https://example.com/k',
        projectId: 'project-123',
        pageSequence: 1,
        pageName: null,
      },
    ]);

    render(<TranscribeProjectPage />);

    await waitFor(() => {
      expect(screen.getByText('Потрібна назва сторінки')).toBeInTheDocument();
    });
  });
});
