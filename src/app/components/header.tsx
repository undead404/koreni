import Link from 'next/link';

import styles from './header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.link}>
        Корені
      </Link>
      <Link href="/map" className={styles.link}>
        Мапа
      </Link>
      <Link href="/tables" className={styles.link}>
        Таблиці
      </Link>
      <Link href="/about" className={styles.link}>
        Про проєкт
      </Link>
    </header>
  );
}
