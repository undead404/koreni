'use client';

import Link from 'next/link';
import { usePostHog } from 'posthog-js/react';

import styles from './home-discover.module.css';

type DiscoveryDestination = 'map' | 'tables' | 'blog' | 'volunteers';
type DiscoveryViewport = 'mobile' | 'desktop';

const destinations: {
  destination: DiscoveryDestination;
  href: string;
  label: string;
}[] = [
  {
    destination: 'map',
    href: '/map',
    label: 'Мапа України з позначками наявних даних',
  },
  { destination: 'tables', href: '/tables', label: 'Список наявних таблиць' },
  {
    destination: 'blog',
    href: '/blog',
    label: 'Блог коренів – про рушій та індексування',
  },
  {
    destination: 'volunteers',
    href: '/volunteers',
    label: 'Перелік тих, хто приніс дорогоцінні таблиці',
  },
];

function getViewport(): DiscoveryViewport {
  return window.innerWidth < 768 ? 'mobile' : 'desktop';
}

export default function HomeDiscover() {
  const posthog = usePostHog();

  const trackClick = (destination: DiscoveryDestination) => {
    try {
      posthog.capture('home_discover_clicked', {
        destination,
        viewport: getViewport(),
      });
    } catch {
      // Analytics must never interfere with navigation.
    }
  };

  return (
    <section className={styles.section} aria-labelledby="home-discover-title">
      <h2 id="home-discover-title" className={styles.heading}>
        Що ще тут є?
      </h2>
      <ul className={styles.list}>
        {destinations.map(({ destination, href, label }) => (
          <li key={destination} className={styles.item}>
            <Link
              className={styles.link}
              href={href}
              onClick={() => {
                trackClick(destination);
              }}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
