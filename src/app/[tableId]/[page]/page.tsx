import _ from 'lodash';
import { Suspense } from 'react';

import getTableData from '@/shared/get-table-data';
import getTablesMetadata from '@/shared/get-tables-metadata';

import IndexTable from '../../components/index-table';
import MapWrapper from '../../components/map-wrapper';
import Pagination from '../../components/pagination';
import { PER_PAGE } from '../../constants';
import getTableMetadata from '../../helpers/get-table-metadata';

import styles from './page.module.css';

type TablePageProperties = {
  params: Promise<{ page: string; tableId: string }>;
};

export async function generateMetadata({ params }: TablePageProperties) {
  const { page, tableId } = await params;
  const tableMetadata = await getTableMetadata(tableId);
  return {
    title: `Корені | ${tableMetadata.title} | Ст. ${page}`,
  };
}

export default async function Table({ params }: TablePageProperties) {
  const { page, tableId } = await params;
  const tableMetadata = await getTableMetadata(tableId);
  const tableData = await getTableData(tableMetadata);
  const pageInt = Number.parseInt(page, 10) || 1;
  const tableDataToDisplay = tableData.slice(
    (pageInt - 1) * PER_PAGE,
    pageInt * PER_PAGE,
  );
  return (
    <article className={styles.article}>
      <h1>{tableMetadata.title}</h1>
      <section>
        <h3>Метадані</h3>
        <p>Виконавець індексації: {tableMetadata.author || 'Невідомий'}</p>
        <MapWrapper
          points={[
            {
              coordinates: tableMetadata.location,
              linkedRecords: [{ title: tableMetadata.title }],
            },
          ]}
          zoom={8}
        />
      </section>
      <section className={styles.tableContainer}>
        <h3>Дані</h3>
        <Suspense
          fallback={
            <div className={styles.suspenseFallback}>Завантаження...</div>
          }
        >
          <Pagination
            currentPage={pageInt}
            totalPages={Math.ceil(tableData.length / PER_PAGE)}
            urlBuilder={(page: number) => `/${tableId}/${page}`}
          />
          <IndexTable
            data={tableDataToDisplay}
            locale={tableMetadata.tableLocale}
            page={pageInt}
            tableId={tableId}
          />
          <Pagination
            currentPage={pageInt}
            totalPages={Math.ceil(tableData.length / PER_PAGE)}
            urlBuilder={(page: number) => `/${tableId}/${page}`}
          />
        </Suspense>
      </section>
    </article>
  );
}

export async function generateStaticParams() {
  const tablesMetadata = await getTablesMetadata();
  const result = tablesMetadata.flatMap((tableMetadata) =>
    _.times(Math.ceil(tableMetadata.size / PER_PAGE), (index) => ({
      page: `${index + 1}`,
      tableId: `${tableMetadata.id}`,
    })),
  );
  return result;
}
