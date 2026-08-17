import { cleanup, render, waitFor } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import { afterEach, describe, expect, it, vi } from 'vitest';

import IndexTableWithParameters from './index-table-with-parameters';

vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(),
}));

const useSearchParametersMock = vi.mocked(useSearchParams);

vi.mock('../hocs/with-error-boundary');

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

const mockData = [
  { name: 'John', age: 30 },
  { name: 'Jane', age: 25 },
];

const defaultProperties = {
  data: mockData,
  locale: 'uk' as const,
  page: 1,
  tableId: 'test-table',
};

describe('IndexTableWithParameters component', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('should render IndexTable immediately with empty matchedTokens and null targetRowId', () => {
    useSearchParametersMock.mockReturnValue(createMockSearchParameters({}));
    Element.prototype.scrollIntoView = vi.fn();

    const { container } = render(
      <IndexTableWithParameters {...defaultProperties} />,
    );

    // Table should be in DOM immediately
    const table = container.querySelector('table');
    expect(table).toBeInTheDocument();

    // No marks should be rendered initially
    const marks = container.querySelectorAll('mark');
    expect(marks.length).toBe(0);
  });

  it('should pass updated matchedTokens and targetRowId to IndexTable after parameters arrive', async () => {
    useSearchParametersMock.mockReturnValue(
      createMockSearchParameters({
        matched_tokens: 'John',
        show_row: 'test-table-1',
      }),
    );
    Element.prototype.scrollIntoView = vi.fn();

    const { container } = render(
      <IndexTableWithParameters {...defaultProperties} />,
    );

    // Wait for TableParameterReader to update state
    await waitFor(() => {
      const marks = container.querySelectorAll('mark');
      expect(marks.length).toBeGreaterThan(0);
    });

    // Verify the mark is rendered
    const mark = container.querySelector('mark');
    expect(mark?.textContent).toBe('John');

    // Verify the target row is marked
    const targetRow = container.querySelector('tr#row-test-table-1');
    expect(targetRow).toBeInTheDocument();
  });

  it('should handle multiple matched tokens', async () => {
    useSearchParametersMock.mockReturnValue(
      createMockSearchParameters({
        matched_tokens: 'John,Jane',
      }),
    );
    Element.prototype.scrollIntoView = vi.fn();

    const { container } = render(
      <IndexTableWithParameters {...defaultProperties} />,
    );

    await waitFor(() => {
      const marks = container.querySelectorAll('mark');
      expect(marks.length).toBe(2);
    });
  });

  it('should update when URL parameters change', async () => {
    useSearchParametersMock.mockReturnValue(
      createMockSearchParameters({
        matched_tokens: 'John',
      }),
    );
    Element.prototype.scrollIntoView = vi.fn();

    const { rerender, container } = render(
      <IndexTableWithParameters {...defaultProperties} />,
    );

    await waitFor(() => {
      const marks = container.querySelectorAll('mark');
      expect(marks.length).toBe(1);
    });

    // Simulate URL parameters changing
    useSearchParametersMock.mockReturnValue(
      createMockSearchParameters({
        matched_tokens: 'Jane',
      }),
    );

    rerender(<IndexTableWithParameters {...defaultProperties} />);

    await waitFor(() => {
      const marks = container.querySelectorAll('mark');
      expect(marks.length).toBe(1);
      expect(marks[0].textContent).toBe('Jane');
    });
  });
});
