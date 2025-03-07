'use client';
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';

import { type MapProperties } from './map';

const Map = lazy(() => import('./map'));

import withErrorBoundary from '../hocs/with-error-boundary';

import styles from './map-wrapper.module.css';

// TODO rework this wrapper to independent details component with children
// and pass then Map to it as a child
export function MapWrapper(
  properties: MapProperties & {
    open?: boolean;
    title?: string;
  },
) {
  const [show, setShow] = useState(false);
  const handleClick = useCallback(() => {
    setShow(true);
  }, []);

  useEffect(() => {
    if (properties.open) {
      setShow(true);
    }
  }, [properties.open]);

  return properties.title ? (
    <details
      className={styles.location}
      onClick={handleClick}
      open={properties.open}
    >
      <summary>
        <h4>{properties.title}</h4>
      </summary>
      <Suspense fallback={<p>Завантаження...</p>}>
        {show && <Map {...properties} />}
      </Suspense>
    </details>
  ) : (
    <Map {...properties} />
  );
}

export default withErrorBoundary(MapWrapper);
