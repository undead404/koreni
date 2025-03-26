import { cleanup, fireEvent, render } from '@testing-library/react';
// import type { Client } from 'typesense';
import { afterEach, describe, expect, it, vi } from 'vitest';

import SearchControls from './search-controls';

const defaultProps = {
  initialValue: 'Мельник',
  areRefinementsExpanded: false,
  // client: {} as Client,
  onFacetChange: vi.fn(),
  onRangeChange: vi.fn(),
  onToggleRefinementsExpanded: vi.fn(),
  onInput: vi.fn(),
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
    expect(input).toHaveValue(defaultProps.initialValue);
  });

  it('should call onInput when the input value changes', () => {
    const { getByPlaceholderText } = render(
      <SearchControls {...defaultProps} />,
    );
    const input = getByPlaceholderText('Мельник');
    const newValue = 'Новий запит';
    fireEvent.change(input, { target: { value: newValue } });
    expect(defaultProps.onInput).toHaveBeenCalledWith(
      new CustomEvent('input', { detail: newValue }),
    );
  });

  it('should apply the correct classes to the elements', () => {
    const { container } = render(<SearchControls {...defaultProps} />);
    const div = container.querySelector('div');
    const input = container.querySelector('input');

    expect(div).toHaveClass('container');
    expect(input).toHaveClass('input');
  });
});
