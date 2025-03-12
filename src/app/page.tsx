import Link from 'next/link';
import { Suspense } from 'react';

import getTablesMetadata from '@/shared/get-tables-metadata';

import Search from './components/search';

import styles from './page.module.css';

export default async function Home() {
  const tablesMetadata = await getTablesMetadata();

  return (
    <>
      <h1 className={styles.title}>Корені</h1>
      <p className={styles.description}>
        Неструктуровані генеалогічні індекси, зібрані з{' '}
        <Link href="/tables">
          {tablesMetadata.length}{' '}
          {String(tablesMetadata.length).endsWith('1')
            ? 'різної таблиці'
            : 'різних таблиць'}
        </Link>{' '}
        у пошуковому рушії.
      </p>
      <Suspense fallback={<p>Завантаження...</p>}>
        <Search />
      </Suspense>
    </>
  );
}
