import Image from 'next/image';
import Link from 'next/link';

import styles from './header.module.css';

import logo from '../assets/logo.png';

export default function Header() {
  return (
    <header className={styles.header}>
      <Link href="/" title="Корені">
        <Image
          src={logo}
          alt="Логотип Коренів"
          className="filter-inverted"
          width={44}
          height={44}
        />
      </Link>
      <nav aria-label="Main navigation">
        <ul className={`${styles.navList} no-disc`}>
          <li>
            <Link href="/map" className={styles.link}>
              Мапа
            </Link>
          </li>
          <li>
            <Link href="/tables" className={styles.link}>
              Таблиці
            </Link>
          </li>
          <li>
            <Link href="/volunteers" className={styles.link}>
              Волонтери
            </Link>
          </li>
          <li>
            <Link href="/about" className={styles.link}>
              Про проєкт
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
