'use client';
import { lazy, Suspense } from 'react';

import { type MapProperties } from './map';

const Map = lazy(() => import('./map'));

import withErrorBoundary from '../hocs/with-error-boundary';

import styles from './map-wrapper.module.css';

export function MapWrapper(properties: MapProperties) {
  return (
    <Suspense fallback={<p className={styles.loading}>Завантаження...</p>}>
      <Map {...properties} />
    </Suspense>
  );
}

export default withErrorBoundary(MapWrapper);
