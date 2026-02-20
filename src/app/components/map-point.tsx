import { Icon, type IconOptions } from 'leaflet';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';

import type { MapPoint } from '../helpers/combine-points';

import filledIconImage from '../assets/icons8-marker-40.png';
import blackIconImage from '../assets/icons8-marker-50.png';
import whiteIconImage from '../assets/icons8-marker-50-white.png';

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
const blackIcon: Icon = new Icon({
  ...defaultIconParameters,
  iconUrl: blackIconImage.src,
});
const whiteIcon: Icon = new Icon({
  ...defaultIconParameters,
  iconUrl: whiteIconImage.src,
});

const filledIcon = new Icon({
  ...defaultIconParameters,
  iconUrl: filledIconImage.src,
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
  const [defaultIcon, setDefaultIcon] = useState<Icon>(() =>
    globalThis.window !== undefined &&
    globalThis.matchMedia &&
    globalThis.matchMedia('(prefers-color-scheme: dark)').matches
      ? whiteIcon
      : blackIcon,
  );

  const handleThemeChange = useCallback((event: MediaQueryListEvent) => {
    setDefaultIcon(event.matches ? whiteIcon : blackIcon);
  }, []);

  useEffect(() => {
    if (globalThis.window === undefined || !globalThis.matchMedia) return;
    const mediaQuery = globalThis.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleThemeChange);
    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, [handleThemeChange]);
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
