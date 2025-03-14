'use client';
import { lazy, Suspense, useEffect, useState } from 'react';

import Loader from './loader';
import { type MapProperties } from './map';

const Map = lazy(() => import('./map'));

import withErrorBoundary from '../hocs/with-error-boundary';

/**
 * This components enables to load Map component lazily
 * Because Leaflet requires window on import
 */
export function MapWrapper(properties: MapProperties) {
  const [isShown, setIsShown] = useState(false);
  useEffect(() => {
    setIsShown(true);
  }, []);
  return (
    <Suspense fallback={<Loader />}>
      {isShown && <Map {...properties} />}
    </Suspense>
  );
}

export default withErrorBoundary(MapWrapper);
