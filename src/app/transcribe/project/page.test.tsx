import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import getProject from '../api/get-project';
import getProjectImages from '../api/get-project-images';
import getProjectSchemas from '../api/get-project-schemas';
import updateProject from '../api/update-project';

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

describe('ProjectDetailsPage', () => {
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

  it('redirects to /transcribe if projectId parameter is invalid', async () => {
    (useSearchParams as Mock).mockReturnValue({
      get: vi.fn().mockReturnValue('invalid_id_#'),
    });

    render(<ProjectDetailsPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/transcribe');
    });
  });

  it('renders CTA "Enter Workspace" as disabled if the fetched image list has 0 images', async () => {
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
    (getProjectImages as Mock).mockResolvedValue([]);

    render(<ProjectDetailsPage />);

    // Wait for load to complete
    await waitFor(() => {
      expect(
        screen.queryByText('Loading project details...'),
      ).not.toBeInTheDocument();
    });

    const enterButton = screen.getByTestId('enter-workspace-btn');
    expect(enterButton).toBeDisabled();
  });

  it('renders CTA "Enter Workspace" as active if the fetched image list is non-empty', async () => {
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
      expect(
        screen.queryByText('Loading project details...'),
      ).not.toBeInTheDocument();
    });

    const enterButton = screen.getByTestId('enter-workspace-btn');
    expect(enterButton).not.toBeDisabled();
    const href = enterButton.getAttribute('href');
    expect(
      href === '/transcribe/workspace?projectId=project-123' ||
        href === '/transcribe/workspace/?projectId=project-123',
    ).toBe(true);
  });

  it('switches tabs cleanly on tab button clicks', async () => {
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
    (getProjectImages as Mock).mockResolvedValue([]);

    render(<ProjectDetailsPage />);

    await waitFor(() => {
      expect(
        screen.queryByText('Loading project details...'),
      ).not.toBeInTheDocument();
    });

    // Should initially show Metadata form
    expect(screen.getByLabelText('Title')).toBeInTheDocument();

    // Click on Asset Manager Tab
    const assetsTabButton = screen.getByText('Asset Manager');
    fireEvent.click(assetsTabButton);

    // Verify Asset Manager subview is active (has Select Images / Select More Images)
    await waitFor(() => {
      expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();
      expect(screen.getByText('Upload Images')).toBeInTheDocument();
    });

    // Click on Operations Tab
    const operationsTabButton = screen.getByText('Operations');
    fireEvent.click(operationsTabButton);

    // Verify Operations view
    await waitFor(() => {
      expect(screen.getByText('Data Export Options')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Future features will include data exports to CSV, JSON, and XML format.',
        ),
      ).toBeInTheDocument();
    });
  });

  it('submits metadata form edits successfully and triggers sonner success toast', async () => {
    (useSearchParams as Mock).mockReturnValue({
      get: vi.fn().mockReturnValue('project-123'),
    });
    const mockProj = {
      id: 'project-123',
      title: 'Original Title',
      type: 'table' as const,
      isHandwritten: true,
      location: [48.9, 24.5] as [number, number],
      tableLocale: 'uk' as const,
      yearsRange: [1850, 1900] as [number, number],
      sources: [],
    };
    (getProject as Mock).mockResolvedValue({
      success: true,
      project: mockProj,
    });
    (getProjectImages as Mock).mockResolvedValue([]);
    (updateProject as Mock).mockResolvedValue({ success: true });

    render(<ProjectDetailsPage />);

    await waitFor(() => {
      expect(
        screen.queryByText('Loading project details...'),
      ).not.toBeInTheDocument();
    });

    // Modify Title field
    const titleInput = screen.getByLabelText('Title');
    fireEvent.change(titleInput, {
      target: { value: 'Updated Project Title' },
    });

    // Submit form
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateProject).toHaveBeenCalledWith('project-123', {
        title: 'Updated Project Title',
        type: 'table',
        isHandwritten: true,
        location: [48.9, 24.5],
        tableLocale: 'uk',
        yearsRange: [1850, 1900],
        sources: [],
      });
      expect(toast.success).toHaveBeenCalledWith(
        'Project details updated successfully',
      );
    });
  });
});
