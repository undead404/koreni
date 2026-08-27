import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import search from '../services/search';

import { SearchPage } from './search';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock('../environment');
vi.mock('../hocs/with-error-boundary');
vi.mock('../services/search', () => ({
  __esModule: true,
  default: vi.fn(),
}));
vi.mock('../services/typesense', () => ({
  __esModule: true,
  default: vi.fn(),
}));

const mockSearchResults = [
  {
    document: { id: '1', tableId: 'table1', title: 'Document 1', year: 1820 },
    highlight: {
      data: {
        field1: {
          snippet: '<strong>highlighted</strong> text',
          matched_tokens: ['highlighted'],
        },
      },
    },
    text_match_info: { typo_prefix_score: 0 },
  },
  {
    document: { id: '2', tableId: 'table2', title: 'Document 2', year: 1825 },
    highlight: {
      data: {
        field2: {
          snippet: '<strong>another</strong> highlight',
          matched_tokens: ['another'],
        },
      },
    },
    text_match_info: { typo_prefix_score: 0 },
  },
];

const mockSearchParameters = new URLSearchParams({ query: 'test' });

describe('SearchPage component', () => {
  const mockRouter = { push: vi.fn(), replace: vi.fn() };

  // Cleanup after each test
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  beforeEach(() => {
    (useRouter as Mock).mockReturnValue(mockRouter);
    (usePathname as Mock).mockReturnValue('/');
    (useSearchParams as Mock).mockReturnValue(mockSearchParameters);
    (search as Mock).mockResolvedValue([
      mockSearchResults,
      mockSearchResults.length,
    ]);
  });

  it('should render the search controls and results components', () => {
    const { getByPlaceholderText } = render(<SearchPage recordsNumber={10} />);

    expect(getByPlaceholderText('Мельник')).toBeInTheDocument();
  });

  it('triggers router.replace to retreat when on an empty page beyond total results', async () => {
    const searchParametersForRetreat = new URLSearchParams({
      page: '13',
      query: 'Мельник',
    });
    (useSearchParams as Mock).mockReturnValue(searchParametersForRetreat);
    (search as Mock).mockResolvedValueOnce([[], 480]);

    render(<SearchPage recordsNumber={1000} />);

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith(
        expect.stringContaining('page=12'),
        expect.objectContaining({ scroll: false }),
      );
    });
  });

  it('maintains bounded page count and disabled Next button after retreating to a page with hits', async () => {
    const searchParametersPage13 = new URLSearchParams({
      page: '13',
      query: 'Мельник',
    });
    (useSearchParams as Mock).mockReturnValue(searchParametersPage13);
    (search as Mock).mockResolvedValueOnce([[], 480]);

    const { rerender } = render(<SearchPage recordsNumber={1000} />);

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith(
        expect.stringContaining('page=12'),
        expect.objectContaining({ scroll: false }),
      );
    });

    const searchParametersPage12 = new URLSearchParams({
      page: '12',
      query: 'Мельник',
    });
    (useSearchParams as Mock).mockReturnValue(searchParametersPage12);
    (search as Mock).mockResolvedValueOnce([mockSearchResults, 480]);

    rerender(<SearchPage recordsNumber={1000} />);

    await waitFor(() => {
      expect(screen.getByText('Сторінка 12 з 12')).toBeInTheDocument();
    });

    const nextButton = screen.getByRole('button', { name: 'Наступна' });
    expect(nextButton).toBeDisabled();
  });
});
