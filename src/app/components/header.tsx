'use client';

import clsx from 'clsx';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import styles from './header.module.css';

import logo from '../assets/logo.png';

export default function Header() {
  const pathname = usePathname();

  return (
    <header className={styles.header}>
      <nav aria-label="Main navigation">
        <ul className={clsx(styles.navList, 'no-disc')}>
          <li>
            <Link href="/">
              <Image
                src={logo}
                alt="Логотип Коренів"
                className="filter-inverted"
                width={44}
                height={44}
              />
            </Link>
          </li>
          <li>
            <Link
              href="/"
              className={clsx(styles.link, pathname === '/' && styles.active)}
              aria-current={pathname === '/' ? 'page' : undefined}
            >
              Пошук
            </Link>
          </li>
          <li>
            <Link
              href="/map"
              className={clsx(
                styles.link,
                pathname === '/map' && styles.active,
              )}
              aria-current={pathname === '/map' ? 'page' : undefined}
            >
              Мапа
            </Link>
          </li>
          <li>
            <Link
              href="/tables"
              className={clsx(
                styles.link,
                pathname === '/tables' && styles.active,
              )}
              aria-current={pathname === '/tables' ? 'page' : undefined}
            >
              Таблиці
            </Link>
          </li>
          <li>
            <Link
              href="/volunteers"
              className={clsx(
                styles.link,
                pathname === '/volunteers' && styles.active,
              )}
              aria-current={pathname === '/volunteers' ? 'page' : undefined}
            >
              Волонтери
            </Link>
          </li>
          <li>
            <Link
              href="/contribute"
              className={clsx(
                styles.link,
                pathname === '/contribute' && styles.active,
              )}
              aria-current={pathname === '/contribute' ? 'page' : undefined}
            >
              Поділитися даними
            </Link>
          </li>
          <li>
            <Link
              href="/about"
              className={clsx(
                styles.link,
                pathname === '/about' && styles.active,
              )}
              aria-current={pathname === '/about' ? 'page' : undefined}
            >
              Про проєкт
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
