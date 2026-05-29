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

// Mock crypto.randomUUID for consistent IDs in tests
Object.defineProperty(globalThis.crypto, 'randomUUID', {
  value: vi.fn(() => `test-uuid-${Math.random()}`),
});

describe('TranscribeProjectPage', () => {
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
      // Check left panel (viewer)
      expect(screen.getByText(/12 \(1 \/ 1\)/)).toBeInTheDocument();

      // Check right panel (table)
      expect(screen.getByText('Транскрипція')).toBeInTheDocument();
      expect(screen.getByText('Додати рядок')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
    });
  });

  it('allows adding and deleting rows in the transcription table', async () => {
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
        pageName: '12',
      },
    ]);

    render(<TranscribeProjectPage />);

    await waitFor(() => {
      expect(screen.getByText('Транскрипція')).toBeInTheDocument();
    });

    // Initial state has 1 row
    const rowsBefore = screen.getAllByPlaceholderText('Name');
    expect(rowsBefore.length).toBe(1);

    // Add a row
    const addButton = screen.getByText('Додати рядок');
    fireEvent.click(addButton);

    const rowsAfterAdd = screen.getAllByPlaceholderText('Name');
    expect(rowsAfterAdd.length).toBe(2);

    // Delete a row
    const deleteButtons = screen.getAllByTitle('Видалити');
    fireEvent.click(deleteButtons[0]);

    const rowsAfterDelete = screen.getAllByPlaceholderText('Name');
    expect(rowsAfterDelete.length).toBe(1);
  });

  it('allows inserting a row above another row', async () => {
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
        pageName: '12',
      },
    ]);

    render(<TranscribeProjectPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
    });

    // Fill the first row
    const firstRowInput = screen.getByPlaceholderText('Name');
    fireEvent.change(firstRowInput, { target: { value: 'First Row' } });

    // Click "Додати рядок вище"
    const insertAboveButton = screen.getByTitle('Додати рядок вище');
    fireEvent.click(insertAboveButton);

    const nameInputs = screen.getAllByPlaceholderText('Name');
    expect(nameInputs.length).toBe(2);

    // The new row should be at index 0, so the 'First Row' should now be at index 1
    expect(nameInputs[0]).toHaveValue('');
    expect(nameInputs[1]).toHaveValue('First Row');
  });

  it('updates row state when typing in inputs', async () => {
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
        pageName: '12',
      },
    ]);

    render(<TranscribeProjectPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
    });

    const lastNameInput = screen.getByPlaceholderText('Name');
    fireEvent.change(lastNameInput, { target: { value: 'Shevchenko' } });
    expect(lastNameInput).toHaveValue('Shevchenko');

    const firstNameInput = screen.getByPlaceholderText('Note');
    fireEvent.change(firstNameInput, { target: { value: 'Test note' } });
    expect(firstNameInput).toHaveValue('Test note');
  });

  it('substitutes historical Russian characters when locale is ru', async () => {
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
        pageName: '12',
      },
    ]);
    (getProject as Mock).mockResolvedValue({
      success: true,
      project: {
        tableLocale: 'ru',
      },
    });

    render(<TranscribeProjectPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText('Name');

    // Test some replacements
    fireEvent.change(nameInput, { target: { value: 'еее' } });
    expect(nameInput).toHaveValue('ѣ');

    fireEvent.change(nameInput, { target: { value: 'иии' } });
    expect(nameInput).toHaveValue('ы');

    fireEvent.change(nameInput, { target: { value: 'ььь' } });
    expect(nameInput).toHaveValue('ъ');

    fireEvent.change(nameInput, { target: { value: 'ііі' } });
    expect(nameInput).toHaveValue('ѵ');

    fireEvent.change(nameInput, { target: { value: 'ІІІ' } });
    expect(nameInput).toHaveValue('Ѵ');

    fireEvent.change(nameInput, { target: { value: 'ффф' } });
    expect(nameInput).toHaveValue('ѳ');

    fireEvent.change(nameInput, { target: { value: 'I' } });
    expect(nameInput).toHaveValue('І');
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

  it('updates image transform when zoom buttons are clicked', async () => {
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
        pageName: '12',
      },
    ]);

    render(<TranscribeProjectPage />);

    await waitFor(() => {
      expect(screen.getByAltText('12')).toBeInTheDocument();
    });

    const displayImage = screen.getByAltText('12');
    const zoomInButton = screen.getByTitle('Zoom In');
    const zoomOutButton = screen.getByTitle('Zoom Out');
    const resetButton = screen.getByTitle('Reset');

    // Initial transform
    expect(displayImage).toHaveStyle({
      transform: 'translate(0px, 0px) scale(1)',
    });

    // Zoom In
    fireEvent.click(zoomInButton);
    expect(displayImage.style.transform).toContain('scale(1.2)');

    // Zoom Out
    fireEvent.click(zoomOutButton);
    expect(displayImage.style.transform).toContain('scale(1)');

    // Reset
    fireEvent.click(zoomInButton);
    fireEvent.click(resetButton);
    expect(displayImage).toHaveStyle({
      transform: 'translate(0px, 0px) scale(1)',
    });
  });

  it('updates image transform when dragging', async () => {
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
        pageName: '12',
      },
    ]);

    render(<TranscribeProjectPage />);

    await waitFor(() => {
      expect(screen.getByAltText('12')).toBeInTheDocument();
    });

    const displayImage = screen.getByAltText('12');
    const viewer = displayImage.parentElement!;

    // Initial transform
    expect(displayImage).toHaveStyle({
      transform: 'translate(0px, 0px) scale(1)',
    });

    // Drag
    fireEvent.mouseDown(viewer, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(viewer, { clientX: 150, clientY: 170 });
    fireEvent.mouseUp(viewer);

    expect(displayImage.style.transform).toContain('translate(50px, 70px)');
  });

  it('disables table and shows announcement when pageName is missing', async () => {
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

    const addButton = screen.getByText('Додати рядок');
    expect(addButton).toBeDisabled();

    const inputs = screen.getAllByPlaceholderText('Name');
    expect(inputs[0]).toBeDisabled();
  });
});
