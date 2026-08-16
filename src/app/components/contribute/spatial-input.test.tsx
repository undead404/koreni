import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { KnownLocationsContext } from './known-locations-context';
import { SpatialInput } from './spatial-input';
import type { Location } from './types';

vi.mock('@/app/services/locationiq', () => ({
  autocomplete: vi.fn(),
}));

vi.mock('posthog-js/react', () => ({
  usePostHog: () => ({ capture: vi.fn() }),
}));

vi.mock('./location-picker', () => ({
  default: () => <div data-testid="location-picker" />,
}));

const mockKnownLocations: Location[] = [
  { coordinates: [50.45, 30.52], title: 'Kyiv' },
  { coordinates: [49.84, 24.03], title: 'Lviv' },
];

function renderSpatialInput(
  properties: { value: string; onChange: (value: string) => void },
  locations: Location[] = mockKnownLocations,
) {
  return render(
    <KnownLocationsContext.Provider value={locations}>
      <SpatialInput {...properties} />
    </KnownLocationsContext.Provider>,
  );
}

describe('SpatialInput', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('Dropdown absent on initial mount', () => {
    const onChange = vi.fn();
    const { queryByRole } = renderSpatialInput({ value: '', onChange });

    expect(queryByRole('listbox')).toBeNull();
  });

  it('Dropdown renders on focus with local results', () => {
    const onChange = vi.fn();
    const { getByRole, queryAllByRole } = renderSpatialInput({
      value: '',
      onChange,
    });

    const input = getByRole('combobox');
    fireEvent.focus(input);

    const listbox = getByRole('listbox');
    expect(listbox).not.toBeNull();

    const options = queryAllByRole('option');
    expect(options).toHaveLength(2);
  });

  it('Dropdown absent when value is non-empty', () => {
    const onChange = vi.fn();
    const { getByRole, queryByRole } = renderSpatialInput({
      value: '50.45,30.52',
      onChange,
    });

    const input = getByRole('combobox');
    fireEvent.focus(input);

    expect(queryByRole('listbox')).toBeNull();
  });

  it('Dropdown renders filtered local results on typing', () => {
    const onChange = vi.fn();
    const { getByRole, queryAllByRole } = renderSpatialInput({
      value: '',
      onChange,
    });

    const input = getByRole('combobox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Kyiv' } });

    const listbox = getByRole('listbox');
    expect(listbox).not.toBeNull();

    const options = queryAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('Kyiv');
  });

  it('Regression: Dropdown absent when knownLocations=[] and autocomplete returns undefined', async () => {
    const { autocomplete } = await import('@/app/services/locationiq');
    vi.mocked(autocomplete).mockResolvedValueOnce(undefined);

    const onChange = vi.fn();
    const { getByRole, queryByRole } = renderSpatialInput(
      { value: '', onChange },
      [],
    );

    const input = getByRole('combobox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Kyiv' } });

    vi.advanceTimersByTime(500);

    await vi.runAllTimersAsync();

    expect(queryByRole('listbox')).toBeNull();
  });

  it('Dropdown renders remote results when autocomplete resolves', async () => {
    const { autocomplete } = await import('@/app/services/locationiq');
    vi.mocked(autocomplete).mockResolvedValueOnce([
      {
        display_name: 'Kyiv, Ukraine',
        lat: 50.45,
        lon: 30.52,
        place_id: '1',
      },
    ]);

    const onChange = vi.fn();
    const { getByRole, queryAllByRole } = renderSpatialInput(
      { value: '', onChange },
      [],
    );

    const input = getByRole('combobox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Kyiv' } });

    vi.advanceTimersByTime(500);

    await vi.runAllTimersAsync();

    const listbox = getByRole('listbox');
    expect(listbox).not.toBeNull();

    const options = queryAllByRole('option');
    expect(options.length).toBeGreaterThan(0);
    expect(options[0]).toHaveTextContent('Kyiv, Ukraine');
  });

  it('Selecting item calls onChange and closes dropdown', () => {
    const onChange = vi.fn();
    const { getByRole, queryAllByRole, queryByRole } = renderSpatialInput({
      value: '',
      onChange,
    });

    const input = getByRole('combobox');
    fireEvent.focus(input);

    const options = queryAllByRole('option');
    expect(options.length).toBeGreaterThan(0);

    fireEvent.click(options[0]);

    expect(onChange).toHaveBeenCalledExactlyOnceWith('50.45,30.52');
    expect(queryByRole('listbox')).toBeNull();
  });

  it('Dropdown closes on outside click', () => {
    const onChange = vi.fn();
    const { getByRole, queryByRole } = renderSpatialInput({
      value: '',
      onChange,
    });

    const input = getByRole('combobox');
    fireEvent.focus(input);

    expect(queryByRole('listbox')).not.toBeNull();

    fireEvent.mouseDown(document.body);

    expect(queryByRole('listbox')).toBeNull();
  });
});
