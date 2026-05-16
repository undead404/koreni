import { fireEvent, render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import CsvDropzone from './csv-dropzone';

// Mock dependencies
vi.mock('posthog-js/react', () => ({
  usePostHog: () => ({ capture: vi.fn() }),
}));

vi.mock('@/app/services/bugsnag', () => ({
  initBugsnag: () => ({ notify: vi.fn() }),
}));

vi.mock('./contribution-state', () => ({
  useContributionStateStore: () => ({ setState: vi.fn() }),
}));

vi.mock('./table-state', () => ({
  useTableStateStore: () => ({
    getTableDimensions: () => ({ rows: 0, columns: 0 }),
    setTableData: vi.fn(),
    setTableFileName: vi.fn(),
    tableFileName: null,
  }),
}));

function Wrapper({ children }: { children: React.ReactNode }) {
  const methods = useForm();
  return <FormProvider {...methods}>{children}</FormProvider>;
}

describe('CsvDropzone', () => {
  it('resets to idle state when file selection is cancelled via change event', () => {
    render(
      <Wrapper>
        <CsvDropzone />
      </Wrapper>
    );

    // Find the hidden file input
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();

    // Simulate cancelling file selection (empty files array)
    fireEvent.change(input, { target: { files: [] } });

    // The dropzone should display the idle text
    expect(screen.getByText(/Перетягніть сюди файл CSV/i)).toBeInTheDocument();
  });

  it('resets to idle state when file selection is cancelled via cancel event', () => {
    render(
      <Wrapper>
        <CsvDropzone />
      </Wrapper>
    );

    // Find the hidden file input
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();

    // Simulate the cancel event fired by the browser when the file dialog is closed without selection
    fireEvent(input, new Event('cancel'));

    // The dropzone should display the idle text
    expect(screen.getByText(/Перетягніть сюди файл CSV/i)).toBeInTheDocument();
  });
});
