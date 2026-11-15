import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import MapWrapper from './map-wrapper';

const { unloadedMap } = vi.hoisted(() => ({ unloadedMap: () => null }));

vi.mock('next/dynamic', () => ({
  default: () => unloadedMap,
}));

afterEach(cleanup);

describe('MapWrapper', () => {
  it('reserves the map footprint before the dynamic component loads', () => {
    const { container } = render(<MapWrapper points={[]} zoom={6} />);
    expect(container.firstChild).toHaveClass('mapContainer', 'placeholder');
    expect(container.firstChild).not.toHaveClass('isFullScreen');
  });

  it('reserves the full-height footprint on the map page', () => {
    const { container } = render(
      <MapWrapper points={[]} zoom={6} isFullScreen />,
    );
    expect(container.firstChild).toHaveClass('mapContainer', 'isFullScreen');
  });
});
