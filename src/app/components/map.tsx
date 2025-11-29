'use client';
import Head from 'next/head';
import { useMemo, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';

import calculateCoordinatesAverage from '../helpers/calculate-coordinates-average';
import type { MapPoint } from '../helpers/combine-points';

import MapPointOnMap from './map-point';

import 'leaflet/dist/leaflet.css';
import styles from './map.module.css';

export interface MapProperties {
  center?: [number, number];
  points: MapPoint[];
  zoom: number;
  isFullScreen?: boolean;
}

export default function Map({
  center,
  points,
  zoom,
  isFullScreen,
}: MapProperties) {
  const centerOn = useMemo(
    () =>
      center ||
      calculateCoordinatesAverage(points.map((point) => point.coordinates)),
    [center, points],
  );
  const [activePoint, setActivePoint] = useState<MapPoint | null>(null);
  return (
    <>
      <Head>
        <script
          defer
          src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
          crossOrigin=""
        ></script>
      </Head>
      <MapContainer
        center={centerOn}
        className={`${styles.mapContainer} ${isFullScreen && styles.isFullScreen}`}
        zoom={zoom}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((point, index) => {
          // console.log(point);
          const isActive =
            `${point.coordinates.toString()}` === `${centerOn.toString()}` ||
            (activePoint &&
              `${point.coordinates.toString()}` ===
                `${activePoint.coordinates.toString()}`) ||
            false;
          return (
            <MapPointOnMap
              key={index}
              isPrimary={isActive}
              point={point}
              setActive={setActivePoint}
            />
          );
        })}
      </MapContainer>
    </>
  );
}
