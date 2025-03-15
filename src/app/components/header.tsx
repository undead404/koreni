import Image from 'next/image';
import Link from 'next/link';

import styles from './header.module.css';

import logo from './logo.png';

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
        <Link href="/map" className={styles.link}>
          Мапа
        </Link>
        <Link href="/tables" className={styles.link}>
          Таблиці
        </Link>
        <Link href="/about" className={styles.link}>
          Про проєкт
        </Link>
      </nav>
    </header>
  );
}
