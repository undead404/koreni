import Link from 'next/link';

import styles from './page.module.css';

export default function NotFound() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>404</h1>
      <p className={styles.description}>Вибачте, такої сторінки не існує.</p>
      <Link href="/" className={styles.homeLink}>
        Повернутися на головну
      </Link>
    </div>
  );
}
