import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SpatialInput } from './spatial-input';

vi.mock('posthog-js/react', () => ({
  usePostHog: () => ({
    capture: vi.fn(),
  }),
}));

vi.mock('./location-picker', () => ({
  default: vi.fn(
    ({
      value,
      onChange,
    }: {
      value: string;
      onChange: (value_: string) => void;
    }) => (
      <div data-testid="mock-location-picker">
        <span data-testid="picker-value">{value}</span>
        <button
          type="button"
          data-testid="picker-change-btn"
          onClick={() => {
            onChange('50.4501,30.5234');
          }}
        >
          Set Coordinates
        </button>
      </div>
    ),
  ),
}));

describe('SpatialInput', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders non-map controls correctly', () => {
    const handleChange = vi.fn();
    render(<SpatialInput value="" onChange={handleChange} />);

    expect(screen.getByLabelText('Пошук координат')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Локація для пошуку...'),
    ).toBeInTheDocument();
  });

  it('passes coordinate value to LocationPicker and propagates changes on map interactions', async () => {
    const handleChange = vi.fn();
    render(<SpatialInput value="48.3794,31.1656" onChange={handleChange} />);

    const pickerValue = await screen.findByTestId('picker-value');
    expect(pickerValue).toHaveTextContent('48.3794,31.1656');

    const changeButton = screen.getByTestId('picker-change-btn');
    fireEvent.click(changeButton);

    expect(handleChange).toHaveBeenCalledWith('50.4501,30.5234');
  });

  it('allows clearing selected location', () => {
    const handleChange = vi.fn();
    render(<SpatialInput value="48.3794,31.1656" onChange={handleChange} />);

    const clearButton = screen.getByRole('button', {
      name: 'Clear selected location',
    });
    fireEvent.click(clearButton);

    expect(handleChange).toHaveBeenCalledWith('');
  });
});
