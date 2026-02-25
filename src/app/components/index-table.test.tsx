import { cleanup, render } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { IndexTable, type TableProperties } from './index-table';

vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(),
}));

const useSearchParametersMock = vi.mocked(useSearchParams);

vi.mock('../hocs/with-error-boundary');

const mockData = [
  { name: 'John', age: 30 },
  { name: 'Jane', age: 25 },
];

const defaultProps: TableProperties = {
  data: mockData,
  page: 1,
  tableId: 'test-table',
  locale: 'uk',
};

describe('IndexTable component', () => {
  // Cleanup after each test
  afterEach(() => {
    cleanup();
  });

  it('should render the table element', () => {
    useSearchParametersMock.mockReturnValue({
      get: () => null,
    } as any);
    const { container } = render(<IndexTable {...defaultProps} />);
    const table = container.querySelector('table');
    expect(table).toBeInTheDocument();
  });

  it('should render the correct number of header columns', () => {
    useSearchParametersMock.mockReturnValue({
      get: () => null,
    } as any);
    const { container } = render(<IndexTable {...defaultProps} />);
    const headers = container.querySelectorAll('th');
    expect(headers.length).toBe(Object.keys(mockData[0]).length);
  });

  it('should render the correct number of rows', () => {
    useSearchParametersMock.mockReturnValue({
      get: () => null,
    } as any);
    const { container } = render(<IndexTable {...defaultProps} />);
    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBe(mockData.length);
  });

  it('should render the correct data values', () => {
    useSearchParametersMock.mockReturnValue({
      get: () => null,
    } as any);
    const { getByText } = render(<IndexTable {...defaultProps} />);
    expect(getByText('John')).toBeInTheDocument();
    expect(getByText('30')).toBeInTheDocument();
    expect(getByText('Jane')).toBeInTheDocument();
    expect(getByText('25')).toBeInTheDocument();
  });
});
