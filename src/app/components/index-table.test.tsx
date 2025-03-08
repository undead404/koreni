import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, Mock, vi } from 'vitest';

import getSearchParameters from '../helpers/get-search-parameters';

import { IndexTable, type TableProperties } from './index-table';

vi.mock('../helpers/get-search-parameters', () => ({
  __esModule: true,
  default: vi.fn(),
}));

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
    (getSearchParameters as Mock).mockReturnValue(new URLSearchParams());
    const { container } = render(<IndexTable {...defaultProps} />);
    const table = container.querySelector('table');
    expect(table).toBeInTheDocument();
  });

  it('should render the correct number of header columns', () => {
    (getSearchParameters as Mock).mockReturnValue(new URLSearchParams());
    const { container } = render(<IndexTable {...defaultProps} />);
    const headers = container.querySelectorAll('th');
    expect(headers.length).toBe(Object.keys(mockData[0]).length);
  });

  it('should render the correct number of rows', () => {
    (getSearchParameters as Mock).mockReturnValue(new URLSearchParams());
    const { container } = render(<IndexTable {...defaultProps} />);
    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBe(mockData.length);
  });

  it('should render the correct data values', () => {
    (getSearchParameters as Mock).mockReturnValue(new URLSearchParams());
    const { getByText } = render(<IndexTable {...defaultProps} />);
    expect(getByText('John')).toBeInTheDocument();
    expect(getByText('30')).toBeInTheDocument();
    expect(getByText('Jane')).toBeInTheDocument();
    expect(getByText('25')).toBeInTheDocument();
  });

  it('should highlight matched tokens in the data values', () => {
    const parameters = new URLSearchParams();
    parameters.set('matched_tokens', 'John,25');
    (getSearchParameters as Mock).mockReturnValue(parameters);
    const { container } = render(<IndexTable {...defaultProps} />);
    const highlightedJohn = container.querySelector('mark');
    expect(highlightedJohn).toHaveTextContent('John');
    const highlightedAge = container.querySelectorAll('mark')[1];
    expect(highlightedAge).toHaveTextContent('25');
  });
});
