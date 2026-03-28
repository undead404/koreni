'use client';
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

const MapUpdater = ({ center }: { center: [number, number] | null }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 13);
    }
  }, [center, map]);
  return null;
};
export default MapUpdater;
