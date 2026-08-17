import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { IndexTable, type TableProperties } from './index-table';

vi.mock('../hocs/with-error-boundary');

const mockData = [
  { name: 'John', age: 30 },
  { name: 'Jane', age: 25 },
];

const defaultProps: TableProperties = {
  data: mockData,
  locale: 'uk',
  matchedTokens: [],
  page: 1,
  tableId: 'test-table',
  targetRowId: null,
};

describe('IndexTable component', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render the table element', () => {
    const { container } = render(<IndexTable {...defaultProps} />);
    const table = container.querySelector('table');
    expect(table).toBeInTheDocument();
  });

  it('should render the correct number of header columns', () => {
    const { container } = render(<IndexTable {...defaultProps} />);
    const headers = container.querySelectorAll('thead th');
    expect(headers.length).toBe(Object.keys(mockData[0]).length);
  });

  it('should render the correct number of rows', () => {
    const { container } = render(<IndexTable {...defaultProps} />);
    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBe(mockData.length);
  });

  it('should render the correct data values', () => {
    const { getByText } = render(<IndexTable {...defaultProps} />);
    expect(getByText('John')).toBeInTheDocument();
    expect(getByText('30')).toBeInTheDocument();
    expect(getByText('Jane')).toBeInTheDocument();
    expect(getByText('25')).toBeInTheDocument();
  });

  it('should mark the correct row as isTarget when targetRowId matches the computed rowId', () => {
    Element.prototype.scrollIntoView = vi.fn();
    const { container } = render(
      <IndexTable
        {...defaultProps}
        targetRowId="test-table-1"
        matchedTokens={['John']}
      />,
    );
    const targetRow = container.querySelector('tr#row-test-table-1');
    expect(targetRow).toBeInTheDocument();
    const mark = targetRow?.querySelector('mark');
    expect(mark).toBeInTheDocument();
    expect(mark?.textContent).toBe('John');
  });

  it('should not mark any row as isTarget when targetRowId is null', () => {
    const { container } = render(<IndexTable {...defaultProps} />);
    const marks = container.querySelectorAll('mark');
    expect(marks.length).toBe(0);
  });

  it('should not mark any row as isTarget when targetRowId does not match any rowId', () => {
    const { container } = render(
      <IndexTable {...defaultProps} targetRowId="test-table-9999" />,
    );
    const marks = container.querySelectorAll('mark');
    expect(marks.length).toBe(0);
  });

  it('should render marks for all matchedTokens across all rows', () => {
    const { container } = render(
      <IndexTable {...defaultProps} matchedTokens={['John', 'Jane']} />,
    );
    const marks = container.querySelectorAll('mark');
    expect(marks.length).toBe(2);
    expect(marks[0].textContent).toBe('John');
    expect(marks[1].textContent).toBe('Jane');
  });
});
