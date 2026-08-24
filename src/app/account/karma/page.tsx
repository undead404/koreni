import { Suspense } from 'react';

import KarmaConnectionsClient from './karma-connections-client';

import styles from './page.module.css';

export default function KarmaConnectionsPage() {
  return (
    <Suspense
      fallback={
        <main className={styles.root}>
          <p>Завантаження...</p>
          <p>Розрахунок може тривати до 15 хвилин. Не закривайте цю вкладку.</p>
        </main>
      }
    >
      <KarmaConnectionsClient />
    </Suspense>
  );
}
