import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MapProperties } from './map';
import { MapWrapper } from './map-wrapper';

vi.mock('../hocs/with-error-boundary');

vi.mock('./map', () => ({
  __esModule: true,
  default: vi.fn(() => <div>Map Component</div>),
}));

const defaultProps: MapProperties = {
  points: [{ coordinates: [0, 0], linkedRecords: [{ title: 'test' }] }],
  zoom: 1,
};

describe('MapWrapper component', () => {
  // Cleanup after each test
  afterEach(() => {
    cleanup();
  });

  it('should render the details and summary elements', () => {
    const { container } = render(
      <MapWrapper {...defaultProps} title="На карті" />,
    );
    const details = container.querySelector('details');
    const summary = container.querySelector('summary');
    expect(details).toBeInTheDocument();
    expect(summary).toBeInTheDocument();
  });

  it("should render the Map component when 'open' prop is true", async () => {
    const { getByText } = render(
      <MapWrapper {...defaultProps} open={true} title="На карті" />,
    );
    await waitFor(() => getByText('Map Component'));
    expect(getByText('Map Component')).toBeInTheDocument();
  });

  it("should not render the Map component when 'open' prop is false initially", () => {
    const { queryByText } = render(
      <MapWrapper {...defaultProps} open={false} title="На карті" />,
    );
    expect(queryByText('Map Component')).not.toBeInTheDocument();
  });

  it('should render the Map component when the details element is clicked', async () => {
    const { container, getByText } = render(
      <MapWrapper {...defaultProps} title="На карті" />,
    );
    const details = container.querySelector('details');
    fireEvent.click(details!);
    await waitFor(() => getByText('Map Component'));
    expect(getByText('Map Component')).toBeInTheDocument();
  });
});
