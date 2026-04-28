import type { Icon } from 'leaflet';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';

import type { MapPoint } from '../helpers/combine-points';
import { blackIcon, filledIcon, whiteIcon } from '../map-icons';

export interface MapPointProperties {
  isPrimary: boolean;
  point: MapPoint;
  setActive: (point: MapPoint | null) => void;
}

export default function MapPointOnMap({
  isPrimary,
  point,
  setActive,
}: MapPointProperties) {
  const [hasHover, setHasHover] = useState(false);
  const eventHandlers = useMemo(
    () => ({
      click: () => {
        setActive(point);
      },
      mouseover: () => {
        setHasHover(true);
      },
      mouseout: () => {
        setHasHover(false);
      },
    }),
    [point, setActive],
  );
  const [defaultIcon, setDefaultIcon] = useState<Icon>(() =>
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    globalThis.window !== undefined &&
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    globalThis.matchMedia &&
    globalThis.matchMedia('(prefers-color-scheme: dark)').matches
      ? whiteIcon
      : blackIcon,
  );

  const handleThemeChange = useCallback((event: MediaQueryListEvent) => {
    setDefaultIcon(event.matches ? whiteIcon : blackIcon);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
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
