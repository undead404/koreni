'use client';
import clsx from 'clsx';
import dynamic from 'next/dynamic';

import type { MapProperties } from './map';

import styles from './map.module.css';

const LazyMap = dynamic(() => import('./map'), {
  ssr: false,
  loading: () => null,
});

export default function MapWrapper(properties: MapProperties) {
  return (
    <div
      className={clsx(styles.mapContainer, styles.placeholder, {
        [styles.isFullScreen]: properties.isFullScreen,
      })}
    >
      <LazyMap {...properties} />
    </div>
  );
}
