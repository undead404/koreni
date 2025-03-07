'use client';
import 'leaflet-defaulticon-compatibility';
import Head from 'next/head';
import Link from 'next/link';
import { useMemo } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';

import calculateCoordinatesAverage from '../helpers/calculate-coordinates-average';
import type { MapPoint } from '../helpers/combine-points';

import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import styles from './map.module.css';

export interface MapProperties {
  points: MapPoint[];
  zoom: number;
  mapClassName?: string;
}

export default function Map({ points, zoom, mapClassName }: MapProperties) {
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
        className={`${styles.mapContainer} ${mapClassName}`}
        zoom={zoom}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((point, index) => {
          // console.log(point);
          const linkedRecords = point.linkedRecords;
          return (
            <Marker key={index} position={point.coordinates}>
              <Popup>
                <ul>
                  {linkedRecords.map(({ link, title }, index2) => (
                    <li key={index2}>
                      {link ? <Link href={link}>{title}</Link> : title}
                    </li>
                  ))}
                </ul>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </>
  );
}
