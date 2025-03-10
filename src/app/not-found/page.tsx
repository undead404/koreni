'use client';
import Link from 'next/link';
import { useEffect } from 'react';

import ActiveBugsnag from '../services/bugsnag';

import styles from './page.module.css';

class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export default function NotFound() {
  useEffect(() => {
    ActiveBugsnag.notify(new NotFoundError(globalThis.location.pathname));
  }, []);
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>404</h1>
      <p className={styles.description}>
        Вибачте, такої сторінки не&nbsp;існує.
      </p>
      <Link href="/" className={styles.homeLink}>
        Повернутися на&nbsp;головну
      </Link>
    </div>
  );
}
