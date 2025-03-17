import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import SearchResults, { ResultsProperties } from './search-results';

vi.mock('../schemas/search-result', () => ({
  __esModule: true,
  default: {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    parse: vi.fn((result) => result),
  },
}));

const defaultProps = {
  loading: false,
  recordsNumber: 10,
  results: [
    {
      document: {
        id: '1-3001',
        tableId: 'table1',
        title: 'Document 1',
      },
      highlight: {
        data: {
          field1: {
            snippet: '<strong>highlighted</strong> text',
            matched_tokens: ['highlighted'],
          },
        },
      },
      text_match: 1,
    },
    {
      document: {
        id: '2-2',
        tableId: 'table2',
        title: 'Document 2',
      },
      highlight: {
        data: {
          field2: {
            snippet: '<strong>another</strong> highlight',
            matched_tokens: ['another'],
          },
        },
      },
      text_match: 1,
    },
  ],
  resultsNumber: 2,
} as ResultsProperties;

describe('SearchResults component', () => {
  // Cleanup after each test
  afterEach(() => {
    cleanup();
  });

  it('should render the table element', () => {
    const { container } = render(<SearchResults {...defaultProps} />);
    const table = container.querySelector('table');
    expect(table).toBeInTheDocument();
  });

  it('should render the correct number of results', () => {
    const { getByText } = render(<SearchResults {...defaultProps} />);
    expect(getByText('Знайдено результатів: 2')).toBeInTheDocument();
  });

  it('should render the correct number of tbody elements', () => {
    const { container } = render(<SearchResults {...defaultProps} />);
    const tbodyElements = container.querySelectorAll('tbody');
    expect(tbodyElements.length).toBe(defaultProps.results.length);
  });

  it('should render the correct snippets and links', () => {
    const { container } = render(<SearchResults {...defaultProps} />);
    const snippets = container.querySelectorAll('.snippet');
    const links = container.querySelectorAll('a');

    expect(snippets[0].innerHTML).toBe('<strong>highlighted</strong> text');
    expect(snippets[1].innerHTML).toBe('<strong>another</strong> highlight');

    expect(links[0]).toHaveAttribute(
      'href',
      '/table1/4?matched_tokens=highlighted&show_row=1-3001',
    );

    expect(links[1]).toHaveAttribute(
      'href',
      '/table2/1?matched_tokens=another&show_row=2-2',
    );
  });

  it('should apply the correct styles based on loading state', () => {
    const { container: container1 } = render(
      <SearchResults {...defaultProps} loading={false} />,
    );
    const table1 = container1.querySelector('table');
    expect(table1).toHaveStyle({ opacity: 1 });

    const { container: container2 } = render(
      <SearchResults {...defaultProps} loading={true} />,
    );
    const table2 = container2.querySelector('table');
    expect(table2).toHaveStyle({ opacity: 0.5 });
  });
});
