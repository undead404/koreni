import type { Metadata } from 'next';

import getTablesMetadata from '@/shared/get-tables-metadata';

import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Корені | Список таблиць',
};

export default async function TablesPage() {
  const tablesMetadata = await getTablesMetadata();

  return (
    <>
      <h1>Наявні таблиці</h1>
      <ul className={`no-disc ${styles.list}`}>
        {tablesMetadata.map((tableMetadata) => (
          <li key={tableMetadata.id}>
            <a href={`/${tableMetadata.id}/1`}>{tableMetadata.title}</a>
          </li>
        ))}
      </ul>
    </>
  );
}
