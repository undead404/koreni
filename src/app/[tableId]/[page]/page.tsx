import _ from 'lodash';
import Head from 'next/head';
import type { ReactNode } from 'react';

import ArchiveItem from '@/app/components/archive-item';
import { Details } from '@/app/components/details';
import IndexTable from '@/app/components/index-table';
import MapWrapper from '@/app/components/map-wrapper';
import Pagination from '@/app/components/pagination';
import SourceLink from '@/app/components/source-link';
import { PER_PAGE } from '@/app/constants';
import environment from '@/app/environment';
import getTableMetadata from '@/app/helpers/get-table-metadata';
import getTableData from '@/shared/get-table-data';
import getTablesMetadata from '@/shared/get-tables-metadata';

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
  const sourcesLinks = tableMetadata.sources
    .map((source) => <SourceLink key={source} href={source} />)
    // eslint-disable-next-line unicorn/no-array-reduce
    .reduce(
      (previous, current) => [...previous, ', ', current],
      [] as ReactNode[],
    );
  void sourcesLinks.shift(); // remove first comma

  return (
    <>
      <Head>
        <link
          rel="canonical"
          href={`${environment.NEXT_PUBLIC_SITE}/${tableId}/${page}/`}
          key="canonical"
        />
      </Head>
      <article className={styles.article}>
        <h1>{tableMetadata.title}</h1>
        <section>
          <h2>Метадані</h2>
          <p>
            Виконавець індексації: {tableMetadata.author || 'народ України'}
          </p>
          <p>Таблиці: {sourcesLinks}</p>
          <p>Охоплені роки: {tableMetadata.yearsRange.join('-')}</p>
          {tableMetadata.archiveItems && (
            <Details
              open={tableMetadata.archiveItems.length < 4}
              summary={<h3>Використані архівні справи</h3>}
            >
              <ul className={styles.archiveItems}>
                {tableMetadata.archiveItems.map((archiveItem) => (
                  <ArchiveItem archiveItem={archiveItem} key={archiveItem} />
                ))}
              </ul>
            </Details>
          )}
          <Details summary={<h3>На карті</h3>}>
            <MapWrapper
              points={[
                {
                  coordinates: tableMetadata.location,
                  linkedRecords: [{ title: tableMetadata.title }],
                },
              ]}
              zoom={8}
            />
          </Details>
        </section>
        <section>
          <h2 id="table-data">Дані</h2>
          <Pagination
            currentPage={pageInt}
            totalPages={Math.ceil(tableData.length / PER_PAGE)}
            urlBuilder={(page: number) => `/${tableId}/${page}`}
          />
          <div
            role="region"
            aria-labelledby="table-data"
            tabIndex={0}
            className={styles.tableContainer}
          >
            <IndexTable
              data={tableDataToDisplay}
              locale={tableMetadata.tableLocale}
              page={pageInt}
              tableId={tableId}
            />
          </div>
        </section>
      </article>
    </>
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
