import clsx from 'clsx';
import type { Metadata } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import getTablesMetadata from '@/shared/get-tables-metadata';

import Comments from '../components/comments/comments';
import environment from '../environment';

import JsonLdTables from './table-json-ld';

import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Корені | Список таблиць',
};

export default async function TablesPage() {
  const tablesMetadata = await getTablesMetadata();

  return (
    <>
      <Head>
        <link
          rel="canonical"
          href={`${environment.NEXT_PUBLIC_SITE}/tables/`}
          key="canonical"
        />
      </Head>
      <h1>Наявні таблиці</h1>
      <ul className={clsx(styles.list, 'no-disc')}>
        {tablesMetadata.map((tableMetadata) => (
          <li key={tableMetadata.id}>
            <Link href={`/${tableMetadata.id}/1/`}>{tableMetadata.title}</Link>
          </li>
        ))}
      </ul>
      <Comments />
      <JsonLdTables tablesMetadata={tablesMetadata} />
    </>
  );
}
