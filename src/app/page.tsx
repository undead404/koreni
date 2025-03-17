import _ from 'lodash';
import Link from 'next/link';
import { Suspense } from 'react';

import getTablesMetadata from '@/shared/get-tables-metadata';

import Loader from './components/loader';
import Search from './components/search';

import styles from './page.module.css';

export default async function Home() {
  const tablesMetadata = await getTablesMetadata();
  const recordsNumber = _.sumBy(tablesMetadata, 'size');

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
        у пошуковому рушії. Можливо, десь тут є і твої корені?
      </p>
      <Suspense fallback={<Loader />}>
        <Search recordsNumber={recordsNumber} />
      </Suspense>
    </>
  );
}
