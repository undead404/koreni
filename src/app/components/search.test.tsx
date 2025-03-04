import { cleanup, render } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import search from '../services/search';

import SearchPage from './search';

vi.mock('../services/search', () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock('../services/typesense', () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));
vi.mock('../../environment', () => ({
  __esModule: true,
  default: {
    NEXT_PUBLIC_TYPESENSE_SEARCH_KEY: 'api-key',
    NEXT_PUBLIC_TYPESENSE_HOST: 'typesense.host',
  },
}));

const mockSearchResults = [
  {
    document: { id: '1', tableId: 'table1', title: 'Document 1' },
    highlight: {
      data: {
        field1: {
          snippet: '<strong>highlighted</strong> text',
          matched_tokens: ['highlighted'],
        },
      },
    },
  },
  {
    document: { id: '2', tableId: 'table2', title: 'Document 2' },
    highlight: {
      data: {
        field2: {
          snippet: '<strong>another</strong> highlight',
          matched_tokens: ['another'],
        },
      },
    },
  },
];

const mockSearchParameters = new URLSearchParams({ query: 'test' });

describe('SearchPage component', () => {
  const mockRouter = { replace: vi.fn() };

  // Cleanup after each test
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    (useRouter as vi.Mock).mockReturnValue(mockRouter);
    (useSearchParams as vi.Mock).mockReturnValue(mockSearchParameters);
    (search as vi.Mock).mockResolvedValue([
      mockSearchResults,
      mockSearchResults.length,
    ]);
  });

  it('should render the search controls and results components', () => {
    const { getByText, getByPlaceholderText } = render(<SearchPage />);

    expect(getByText('Пошук')).toBeInTheDocument();
    expect(getByPlaceholderText('Мельник')).toBeInTheDocument();
  });
});
