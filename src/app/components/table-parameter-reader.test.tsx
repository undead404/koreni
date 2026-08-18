import { cleanup, render } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import { afterEach, describe, expect, it, vi } from 'vitest';

import TableParameterReader from './table-parameter-reader';

vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(),
}));

const useSearchParametersMock = vi.mocked(useSearchParams);

/**
 * Helper to create a mock URLSearchParams-like object
 */
function createMockSearchParameters(
  parameters: Record<string, string | null>,
): ReturnType<typeof useSearchParams> {
  return {
    get: (key: string) => parameters[key] ?? null,
  } as ReturnType<typeof useSearchParams>;
}

describe('TableParameterReader component', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('should call onParametersChange with parsed parameters on mount', () => {
    useSearchParametersMock.mockReturnValue(
      createMockSearchParameters({
        matched_tokens: 'Перегинчук',
        show_row: 'DAKhmO-315-1-7037-Cherepashyntsi-1546',
      }),
    );

    const onParametersChange = vi.fn();
    render(<TableParameterReader onParametersChange={onParametersChange} />);

    expect(onParametersChange).toHaveBeenCalledWith({
      matchedTokens: ['Перегинчук'],
      targetRowId: 'DAKhmO-315-1-7037-Cherepashyntsi-1546',
    });
  });

  it('should call onParametersChange with empty matchedTokens when matched_tokens parameter is absent', () => {
    useSearchParametersMock.mockReturnValue(
      createMockSearchParameters({
        show_row: 'DAKhmO-315-1-7037-Cherepashyntsi-1546',
      }),
    );

    const onParametersChange = vi.fn();
    render(<TableParameterReader onParametersChange={onParametersChange} />);

    expect(onParametersChange).toHaveBeenCalledWith({
      matchedTokens: [],
      targetRowId: 'DAKhmO-315-1-7037-Cherepashyntsi-1546',
    });
  });

  it('should call onParametersChange with null targetRowId when show_row parameter is absent', () => {
    useSearchParametersMock.mockReturnValue(
      createMockSearchParameters({
        matched_tokens: 'Перегинчук',
      }),
    );

    const onParametersChange = vi.fn();
    render(<TableParameterReader onParametersChange={onParametersChange} />);

    expect(onParametersChange).toHaveBeenCalledWith({
      matchedTokens: ['Перегинчук'],
      targetRowId: null,
    });
  });

  it('should call onParametersChange with empty state when both parameters are absent', () => {
    useSearchParametersMock.mockReturnValue(createMockSearchParameters({}));

    const onParametersChange = vi.fn();
    render(<TableParameterReader onParametersChange={onParametersChange} />);

    expect(onParametersChange).toHaveBeenCalledWith({
      matchedTokens: [],
      targetRowId: null,
    });
  });

  it('should re-call onParametersChange when searchParameters reference changes', () => {
    useSearchParametersMock.mockReturnValue(
      createMockSearchParameters({
        matched_tokens: 'Іван',
      }),
    );

    const onParametersChange = vi.fn();
    const { rerender } = render(
      <TableParameterReader onParametersChange={onParametersChange} />,
    );

    expect(onParametersChange).toHaveBeenCalledTimes(1);

    // Simulate searchParameters changing
    useSearchParametersMock.mockReturnValue(
      createMockSearchParameters({
        matched_tokens: 'Петро',
      }),
    );

    rerender(<TableParameterReader onParametersChange={onParametersChange} />);

    expect(onParametersChange).toHaveBeenCalledTimes(2);
    expect(onParametersChange).toHaveBeenLastCalledWith({
      matchedTokens: ['Петро'],
      targetRowId: null,
    });
  });

  it('should render no DOM output', () => {
    useSearchParametersMock.mockReturnValue(createMockSearchParameters({}));

    const { container } = render(
      <TableParameterReader onParametersChange={vi.fn()} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('should escape regex special characters in matched tokens', () => {
    useSearchParametersMock.mockReturnValue(
      createMockSearchParameters({
        matched_tokens: 'test.value,another*token',
      }),
    );

    const onParametersChange = vi.fn();
    render(<TableParameterReader onParametersChange={onParametersChange} />);

    expect(onParametersChange).toHaveBeenCalledWith({
      matchedTokens: [String.raw`test\.value`, String.raw`another\*token`],
      targetRowId: null,
    });
  });
});
