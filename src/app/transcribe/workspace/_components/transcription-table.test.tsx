import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import TranscriptionTable from './transcription-table';

describe('TranscriptionTable', () => {
  const mockColumns = [
    {
      id: 'col1',
      title: 'Column 1',
      expectedType: 'string' as const,
      hint: '',
    },
  ];
  const mockRows = [{ id: '1', col1: 'Value 1' }];

  afterEach(() => {
    cleanup();
  });

  it('renders correctly with given props', () => {
    render(
      <TranscriptionTable
        columns={mockColumns}
        rows={mockRows}
        hasPageName={true}
        onAddRow={vi.fn()}
        onDeleteRow={vi.fn()}
        onUpdateRow={vi.fn()}
      />,
    );

    expect(screen.getByPlaceholderText('Column 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Value 1')).toBeInTheDocument();
  });

  it('renders textarea with rows={1}', () => {
    render(
      <TranscriptionTable
        columns={mockColumns}
        rows={mockRows}
        hasPageName={true}
        onAddRow={vi.fn()}
        onDeleteRow={vi.fn()}
        onUpdateRow={vi.fn()}
      />,
    );

    const textarea = screen.getByPlaceholderText('Column 1');
    expect(textarea).toHaveAttribute('rows', '1');
  });
});
