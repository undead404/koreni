import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import getProject from '../api/get-project';
import getProjectImages from '../api/get-project-images';
import getProjectSchemas from '../api/get-project-schemas';

import ProjectDetailsPage from './page';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock('../api/get-project', () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock('../api/get-project-images', () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock('../api/get-project-schemas', () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock('../api/update-project', () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock('../api/save-project-image', () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/app/components/contribute/sources-input', () => ({
  __esModule: true,
  default: vi.fn(() => <div data-testid="sources-input">Sources Input</div>),
}));

vi.mock('@/app/components/contribute/spatial-input', () => ({
  __esModule: true,
  SpatialInput: vi.fn(({ value, onChange }) => (
    <div data-testid="spatial-input">
      <input
        data-testid="spatial-input-field"
        value={value}
        onChange={(event_) => onChange(event_.target.value)}
      />
    </div>
  )),
}));

vi.mock('@/app/components/contribute/years-input', () => ({
  __esModule: true,
  default: vi.fn(({ value, onChange }) => (
    <div data-testid="years-input">
      <input
        data-testid="years-input-field"
        value={value ? value.join(',') : ''}
        onChange={(event_) => {
          const value_ = event_.target.value;
          onChange(value_ ? value_.split(',').map(Number) : []);
        }}
      />
    </div>
  )),
}));

describe('ProjectDetailsPage Integration', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as Mock).mockReturnValue({
      push: mockPush,
    });
    (getProjectSchemas as Mock).mockResolvedValue([
      {
        enabled: true,
        label: 'Late russian confession list',
        value: 'confession-list',
      },
    ]);
  });

  afterEach(() => {
    cleanup();
  });

  it('redirects to /transcribe if projectId parameter is missing', async () => {
    (useSearchParams as Mock).mockReturnValue({
      get: vi.fn().mockReturnValue(null),
    });

    render(<ProjectDetailsPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/transcribe');
    });
  });

  it('loads project data and renders content', async () => {
    (useSearchParams as Mock).mockReturnValue({
      get: vi.fn().mockReturnValue('project-123'),
    });
    (getProject as Mock).mockResolvedValue({
      success: true,
      project: {
        id: 'project-123',
        title: 'Mock Project',
        type: 'table',
        isHandwritten: true,
        location: [48.9, 24.5],
        tableLocale: 'uk',
        yearsRange: [1850, 1900],
        sources: [],
      },
    });
    (getProjectImages as Mock).mockResolvedValue([{ id: 'img-1' }]);

    render(<ProjectDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText('Mock Project')).toBeInTheDocument();
      expect(screen.getByText('Metadata')).toBeInTheDocument();
      expect(screen.getByText('Asset Manager')).toBeInTheDocument();
    });
  });
});
