'use client';
import Head from 'next/head';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import { type ReactNode, useMemo } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';

import calculateCoordinatesAverage from '../helpers/calculate-coordinates-average';

import styles from './map.module.css';

export interface MapProps {
  points: { coordinates: [number, number]; title: ReactNode }[];
  zoom: number;
}

export default function Map({ points, zoom }: MapProps) {
  const averagePoint = useMemo(
    () => calculateCoordinatesAverage(points.map((point) => point.coordinates)),
    [points],
  );
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
        center={averagePoint}
        className={styles.mapContainer}
        zoom={zoom}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((point, index) => (
          <Marker key={index} position={point.coordinates}>
            <Popup>{point.title}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </>
  );
}
