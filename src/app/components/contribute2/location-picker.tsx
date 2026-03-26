'use client';

import type { Marker as LMarker } from 'leaflet';
import { memo, useMemo, useRef } from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';

import { filledIcon } from '@/app/map-icons';

import MapUpdater from './map-updater';
import { coordinatesStringAsTupleSchema } from './schema';

import 'leaflet/dist/leaflet.css';
import styles from './location-picker.module.css';

const MemoizedMarker = memo(function MemoizedMarker({
  position,
  onChange,
}: {
  position: [number, number];
  onChange: (value: string) => void;
}) {
  const markerReference = useRef<LMarker>(null);
  return (
    <Marker
      icon={filledIcon}
      position={position}
      draggable={true}
      ref={markerReference}
      eventHandlers={{
        dragend: () => {
          const marker = markerReference.current;
          if (marker) {
            const newPos = marker.getLatLng();
            onChange(`${newPos.lat},${newPos.lng}`);
          }
        },
      }}
    />
  );
});

function MapClickHandler({ onChange }: { onChange: (value: string) => void }) {
  useMapEvents({
    click(event) {
      onChange(`${event.latlng.lat},${event.latlng.lng}`);
    },
  });
  return null;
}

export default function LocationPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const coordinates = useMemo(() => {
    const parsed = coordinatesStringAsTupleSchema.safeParse(value);
    return parsed.success ? parsed.data : null;
  }, [value]);

  return (
    <MapContainer
      center={coordinates || [48.3794, 31.1656]}
      className={styles.map}
      zoom={coordinates ? 13 : 5}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapUpdater center={coordinates} />
      <MapClickHandler onChange={onChange} />

      {coordinates && (
        <MemoizedMarker position={coordinates} onChange={onChange} />
      )}
    </MapContainer>
  );
}
