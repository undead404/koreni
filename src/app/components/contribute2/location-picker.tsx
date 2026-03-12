'use client';

import type { Marker as LMarker } from 'leaflet';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import { z } from 'zod';

import { filledIcon } from '@/app/map-icons';

import MapUpdater from './map-updater';

import 'leaflet/dist/leaflet.css';
import styles from './location-picker.module.css';

const coordinatesStringAsTupleSchema = z
  .string()
  .regex(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/)
  .transform((value) => {
    const [latString, longString] = value.split(',').map((s) => s.trim());
    const result = [
      Number.parseFloat(latString),
      Number.parseFloat(longString),
    ] as [number, number];
    if (Number.isNaN(result[0]) || Number.isNaN(result[1])) {
      throw new TypeError('Invalid coordinates');
    }
    return result;
  });

export default function LocationPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const markerReference = useRef<LMarker>(null);

  useEffect(() => {
    if (value) {
      try {
        setMapCenter(coordinatesStringAsTupleSchema.parse(value));
      } catch (error) {
        console.error(error);
      }
    }
  }, [value]);

  const coordinates = useMemo(
    () => coordinatesStringAsTupleSchema.safeParse(value)?.data,
    [value],
  );

  return (
    <MapContainer
      center={
        coordinatesStringAsTupleSchema.safeParse(value)?.data || [
          48.3794, 31.1656,
        ]
      } // Дефолт: центр України
      className={styles.map}
      zoom={value ? 13 : 5}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapUpdater center={mapCenter} />

      {coordinates && (
        <Marker
          icon={filledIcon}
          position={coordinates}
          draggable={true}
          ref={markerReference}
          eventHandlers={{
            dragend: () => {
              const marker = markerReference.current;
              if (marker) {
                const newPos = marker.getLatLng();
                const newCoords = [newPos.lat, newPos.lng] as [number, number];
                onChange(newCoords.join(','));
                setMapCenter(newCoords);
              }
            },
          }}
        />
      )}
    </MapContainer>
  );
}
