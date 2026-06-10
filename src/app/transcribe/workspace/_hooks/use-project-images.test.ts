import { renderHook, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import getProject from '../../api/get-project';
import getProjectImages from '../../api/get-project-images';

import { useProjectImages } from './use-project-images';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock('../../api/get-project-images', () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock('../../api/get-project', () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe('useProjectImages', () => {
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
    vi.clearAllMocks();
  });

  it('returns refetchImages function', async () => {
    (useSearchParams as Mock).mockReturnValue({
      get: vi.fn().mockReturnValue('project-123'),
    });
    (getProjectImages as Mock).mockResolvedValue([
      {
        id: 'img-1',
        projectId: 'project-123',
        storageKey: 'key-1.jpg',
        url: 'https://example.com/key-1.jpg',
        pageSequence: 1,
        pageName: '12',
      },
    ]);

    const { result } = renderHook(() => useProjectImages());

    await waitFor(() => {
      expect(result.current.refetchImages).toBeDefined();
    });
  });

  it('refetchImages returns updated images', async () => {
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

    const { result } = renderHook(() => useProjectImages());

    await waitFor(() => {
      expect(result.current.images).toEqual(mockImages);
    });

    const refetchedImages = await result.current.refetchImages();
    expect(refetchedImages).toEqual(mockImages);
  });

  it('refetchImages returns null on error', async () => {
    (useSearchParams as Mock).mockReturnValue({
      get: vi.fn().mockReturnValue('project-123'),
    });
    (getProjectImages as Mock)
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error('API failure'));

    const { result } = renderHook(() => useProjectImages());

    await waitFor(() => {
      expect(result.current.images).toEqual([]);
    });

    const refetchedImages = await result.current.refetchImages();
    expect(refetchedImages).toBeNull();
  });
});
