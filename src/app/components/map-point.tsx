import { Icon, type IconOptions } from 'leaflet';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';

import type { MapPoint } from '../helpers/combine-points';

import filledIconPath from '../assets/icons8-marker-40.png';
import defaultIconPath from '../assets/icons8-marker-50.png';

export interface MapPointProperties {
  isPrimary: boolean;
  point: MapPoint;
  setActive: (point: MapPoint | null) => void;
}

const defaultIconParameters: Partial<IconOptions> = {
  iconSize: [41, 41],
  iconAnchor: [25, 41],
  popupAnchor: [-4, -37],
  // shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  // shadowSize: [41, 41],
};
const defaultIcon: Icon = new Icon({
  ...defaultIconParameters,
  iconUrl: defaultIconPath.src,
});

const filledIcon = new Icon({
  ...defaultIconParameters,
  iconUrl: filledIconPath.src,
});
export default function MapPointOnMap({
  isPrimary,
  point,
  setActive,
}: MapPointProperties) {
  const [hasHover, setHasHover] = useState(false);
  const eventHandlers = useMemo(
    () => ({
      click: () => setActive(point),
      mouseover: () => setHasHover(true),
      mouseout: () => setHasHover(false),
    }),
    [point, setActive],
  );
  return (
    <Marker
      eventHandlers={eventHandlers}
      riseOnHover={true}
      icon={isPrimary ? filledIcon : defaultIcon}
      opacity={hasHover || isPrimary ? 1 : 0.5}
      position={point.coordinates}
      zIndexOffset={isPrimary ? 1000 : 0}
    >
      <Popup>
        <ul>
          {point.linkedRecords.map(({ link, title }, index) => (
            <li key={index}>
              {link ? <Link href={link}>{title}</Link> : title}
            </li>
          ))}
        </ul>
      </Popup>
    </Marker>
  );
}
