'use client';
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';

import { type MapProperties } from './map';

const Map = lazy(() => import('./map'));

import withErrorBoundary from '../hocs/with-error-boundary';

import styles from './map-wrapper.module.css';

export function MapWrapper(properties: MapProperties & { open?: boolean }) {
  const [show, setShow] = useState(false);
  const handleClick = useCallback(() => {
    setShow(true);
  }, []);

  useEffect(() => {
    if (properties.open) {
      setShow(true);
    }
  }, [properties.open]);

  return (
    <details
      className={styles.location}
      onClick={handleClick}
      open={properties.open}
    >
      <summary>
        <h4>Місце</h4>
      </summary>
      <Suspense fallback={<p>Завантаження...</p>}>
        {show && <Map {...properties} />}
      </Suspense>
    </details>
  );
}

export default withErrorBoundary(MapWrapper);
