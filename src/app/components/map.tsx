'use client';
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
    <MapContainer
      center={centerOn}
      className={`${styles.mapContainer} ${isFullScreen ? styles.isFullScreen : ''}`}
      zoom={zoom}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.map((point, index) => {
        const isCenter =
          point.coordinates[0] === centerOn[0] &&
          point.coordinates[1] === centerOn[1];
        const isActive =
          isCenter ||
          (activePoint &&
            point.coordinates[0] === activePoint.coordinates[0] &&
            point.coordinates[1] === activePoint.coordinates[1]) ||
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
  );
}
