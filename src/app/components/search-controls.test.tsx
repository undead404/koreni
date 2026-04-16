import { cleanup, fireEvent, render } from '@testing-library/react';
// import type { Client } from 'typesense';
import { afterEach, describe, expect, it, vi } from 'vitest';

import SearchControls, { type ControlsProperties } from './search-controls';

const defaultProps: ControlsProperties = {
  filters: {
    query: '',
    yearFrom: '',
    yearTo: '',
  },
  onQueryChange: vi.fn(),
  onYearCommit: vi.fn(),
};

describe('SearchControls component', () => {
  // Cleanup after each test
  afterEach(() => {
    cleanup();
  });

  it('should render the input element', () => {
    const { container } = render(<SearchControls {...defaultProps} />);
    const input = container.querySelector('input');
    expect(input).toBeInTheDocument();
  });

  it('should set the input value to the query prop', () => {
    const { getByPlaceholderText } = render(
      <SearchControls {...defaultProps} />,
    );
    const input = getByPlaceholderText('Мельник');
    expect(input).toHaveValue(defaultProps.filters.query);
  });

  it('should call onInput when the input value changes', () => {
    const { getByPlaceholderText } = render(
      <SearchControls {...defaultProps} />,
    );
    const input = getByPlaceholderText('Мельник');
    const newValue = 'Новий запит';
    fireEvent.change(input, { target: { value: newValue } });
    expect(defaultProps.onQueryChange).toHaveBeenCalledWith(newValue);
  });

  it('should apply the correct classes to the elements', () => {
    const { container } = render(<SearchControls {...defaultProps} />);
    const form = container.querySelector('form');
    const input = container.querySelector('input');

    expect(form).toHaveClass('container');
    expect(input).toHaveClass('input');
  });

  it('should apply the correct year filters', () => {
    const { container } = render(<SearchControls {...defaultProps} />);

    const yearFrom = container.querySelector('.yearInput[name="year_from"]');
    const yearTo = container.querySelector('.yearInput[name="year_to"]');
    expect(yearFrom).toBeInTheDocument();
    expect(yearTo).toBeInTheDocument();
  });

  it('should call onYearCommit when the year filters change', () => {
    const { container } = render(<SearchControls {...defaultProps} />);
    const yearFrom = container.querySelector('.yearInput[name="year_from"]')!;
    const yearTo = container.querySelector('.yearInput[name="year_to"]')!;
    const newYearFrom = '2020';
    const newYearTo = '2021';
    fireEvent.change(yearFrom, { target: { value: newYearFrom } });
    expect(defaultProps.onYearCommit).toHaveBeenCalledWith(newYearFrom, '');
    fireEvent.change(yearTo, { target: { value: newYearTo } });
    expect(defaultProps.onYearCommit).toHaveBeenCalledWith(
      newYearFrom,
      newYearTo,
    );
  });
});
