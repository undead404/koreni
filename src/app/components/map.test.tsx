import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import Map, { MapProps } from './map';
import calculateCoordinatesAverage from '../helpers/calculate-coordinates-average';

vi.mock('react-leaflet', () => ({
  __esModule: true,
  MapContainer: vi.fn(({ children }) => (
    <div className="mapContainer">{children}</div>
  )),
  Marker: vi.fn(({ children }) => <div className="marker">{children}</div>),
  Popup: vi.fn(({ children }) => <div>{children}</div>),
  TileLayer: vi.fn(() => <div />),
}));

vi.mock('next/head', () => ({
  __esModule: true,
  default: vi.fn(({ children }) => <>{children}</>),
}));

vi.mock('../helpers/calculate-coordinates-average', () => ({
  __esModule: true,
  default: vi.fn(() => [0, 0]),
}));

const defaultProps: MapProps = {
  points: [
    {
      coordinates: [51.505, -0.09],
      title: 'A pretty CSS3 popup.<br>Easily customizable.',
    },
    { coordinates: [51.51, -0.1], title: 'Another popup' },
  ],
  zoom: 13,
};

describe('Map component', () => {
  // Cleanup after each test
  afterEach(() => {
    cleanup();
  });

  it('should render the Head component with the script tag', () => {
    const { container } = render(<Map {...defaultProps} />);
    const scriptTag = container.querySelector('script');
    expect(scriptTag).toHaveAttribute(
      'src',
      'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    );
    expect(scriptTag).toHaveAttribute(
      'integrity',
      'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=',
    );
  });

  it('should render the MapContainer component', () => {
    const { container } = render(<Map {...defaultProps} />);
    const mapContainer = container.querySelector('.mapContainer');
    expect(mapContainer).toBeInTheDocument();
  });

  it('should call calculateCoordinatesAverage with the correct points', () => {
    render(<Map {...defaultProps} />);
    expect(calculateCoordinatesAverage).toHaveBeenCalledWith([
      [51.505, -0.09],
      [51.51, -0.1],
    ]);
  });

  it('should render the correct number of Marker components', () => {
    const { container } = render(<Map {...defaultProps} />);
    const markers = container.querySelectorAll('.marker');
    expect(markers.length).toBe(defaultProps.points.length);
  });

  it('should render the Popup components with the correct titles', () => {
    const { getByText } = render(<Map {...defaultProps} />);
    expect(
      getByText('A pretty CSS3 popup.<br>Easily customizable.'),
    ).toBeInTheDocument();
    expect(getByText('Another popup')).toBeInTheDocument();
  });
});
