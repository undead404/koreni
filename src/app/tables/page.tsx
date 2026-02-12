import type { Metadata } from 'next';
import Head from 'next/head';

import getTablesMetadata from '@/shared/get-tables-metadata';

import Comments from '../components/comments';
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
      <ul className={`no-disc ${styles.list}`}>
        {tablesMetadata.map((tableMetadata) => (
          <li key={tableMetadata.id}>
            <a href={`/${tableMetadata.id}/1/`}>{tableMetadata.title}</a>
          </li>
        ))}
      </ul>
      <Comments />
      <JsonLdTables tablesMetadata={tablesMetadata} />
    </>
  );
}
