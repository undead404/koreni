import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import SearchResults, { type ResultsProperties } from './search-results';

vi.mock('../schemas/search-result', () => ({
  __esModule: true,
  default: {
    parse: vi.fn((result) => result),

    safeParse: vi.fn((result) => ({ success: true, data: result })),
  },
}));

vi.mock('../environment');

const defaultProps = {
  searchValue: 'Мельник',
  isLoading: false,
  recordsNumber: 10,
  results: [
    {
      document: {
        id: '1-3001',
        tableId: 'table1',
        title: 'Document 1',
        year: 2020,
        raw: {
          field1: 'highlighted text',
        },
      },
      highlight: {
        values: [
          {
            snippet: 'highlightedtext',
            matched_tokens: ['highlighted'],
          },
        ],
      },
      highlights: [
        {
          field: 'values',
          indices: [0],
          matched_tokens: ['highlighted'],
          snippets: ['highlightedtext'],
        },
      ],
      text_match: 1,
      text_match_info: {
        typo_prefix_score: 0,
      },
    },
    {
      document: {
        id: '2-2',
        raw: {
          field2: 'another highlight',
        },
        tableId: 'table2',
        title: 'Document 2',
        year: 2020,
      },
      highlight: {
        values: [
          {
            snippet: 'another highlight',
            matched_tokens: ['another'],
          },
        ],
      },
      highlights: [
        {
          field: 'values',
          indices: [0],
          matched_tokens: ['another'],
          snippets: ['another highlight'],
        },
      ],
      text_match: 1,
      text_match_info: {
        typo_prefix_score: 1,
      } as any,
    },
  ],
  resultsNumber: 2,
} as ResultsProperties;

describe('SearchResults component', () => {
  // Cleanup after each test
  afterEach(() => {
    cleanup();
  });

  it('should render the ul element', () => {
    const { container } = render(<SearchResults {...defaultProps} />);
    const ul = container.querySelector('ul');
    expect(ul).toBeInTheDocument();
  });

  it('should render the correct number of results', () => {
    const { getByText } = render(<SearchResults {...defaultProps} />);
    expect(
      getByText('Знайдено результатів для "Мельник": 2'),
    ).toBeInTheDocument();
  });

  it('should render the correct number of li elements', () => {
    const { container } = render(<SearchResults {...defaultProps} />);
    const liElements = container.querySelectorAll('li');
    expect(liElements.length).toBe(defaultProps.results.length);
  });

  it('should render the correct dd and links', () => {
    const { container } = render(<SearchResults {...defaultProps} />);
    const dds = container.querySelectorAll('dd');
    const links = container.querySelectorAll('a');

    expect(dds[0].innerHTML).toBe(
      '<mark class="highlightMarker">highlighted</mark> text',
    );
    expect(dds[1].innerHTML).toBe(
      '<mark class="highlightMarker">another</mark> highlight',
    );

    expect(links[0]).toHaveAttribute(
      'href',
      '/table1/4?matched_tokens=highlighted&show_row=1-3001',
    );

    expect(links[1]).toHaveAttribute(
      'href',
      '/table2/1?matched_tokens=another&show_row=2-2',
    );
  });

  it('should apply the correct wording based on loading state', () => {
    const { container: container1 } = render(
      <SearchResults
        {...defaultProps}
        resultsNumber={0}
        searchValue=""
        isLoading={false}
      />,
    );
    const header = container1.querySelector('header');
    expect(header).toHaveTextContent('Всього рядків у таблицях: 10');

    const { container: container2 } = render(
      <SearchResults {...defaultProps} resultsNumber={0} isLoading={true} />,
    );
    const header2 = container2.querySelector('header');
    expect(header2).toHaveTextContent('Завантаження...');
  });
});
