import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../_hooks/use-csv-export', () => ({
  useCsvExport: vi.fn(() => ({ exportCsv: vi.fn(), isExporting: false })),
}));

import { useCsvExport } from '../_hooks/use-csv-export';

import OperationsTab from './operations-tab';

const mockUseCsvExport = vi.mocked(useCsvExport);

const DEFAULT_PROPS = { projectId: 'proj-1', projectType: 'confession-list' };

afterEach(() => {
  cleanup();
});

describe('OperationsTab', () => {
  it('renders the export button', () => {
    render(<OperationsTab {...DEFAULT_PROPS} />);
    expect(
      screen.getByRole('button', { name: 'Експортувати CSV' }),
    ).toBeInTheDocument();
  });

  it('button is enabled by default', () => {
    render(<OperationsTab {...DEFAULT_PROPS} />);
    expect(
      screen.getByRole('button', { name: 'Експортувати CSV' }),
    ).not.toBeDisabled();
  });

  it('shows loading state and disables button while exporting', () => {
    mockUseCsvExport.mockReturnValueOnce({
      exportCsv: vi.fn(),
      isExporting: true,
    });
    render(<OperationsTab {...DEFAULT_PROPS} />);
    const button = screen.getByRole('button', { name: 'Експортується…' });
    expect(button).toBeDisabled();
  });

  it('renders only one button', () => {
    render(<OperationsTab {...DEFAULT_PROPS} />);
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
});
