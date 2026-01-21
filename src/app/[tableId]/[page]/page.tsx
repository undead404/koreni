import _ from 'lodash';
import Head from 'next/head';
import type { ReactNode } from 'react';
import { object, string } from 'zod';

import ArchiveItem from '@/app/components/archive-item';
import ContactGate from '@/app/components/contact-gate';
import { Details } from '@/app/components/details';
import IndexTable from '@/app/components/index-table';
import MapWrapper from '@/app/components/map-wrapper';
import Pagination from '@/app/components/pagination';
import SourceLink from '@/app/components/source-link';
import { PER_PAGE } from '@/app/constants';
import environment from '@/app/environment';
import {
  generateIndexationMetadata,
  generateJsonLd,
} from '@/app/helpers/generate-metadata';
import getTableMetadata from '@/app/helpers/get-table-metadata';
import combinedPoints from '@/app/services/map-points';
import getTableData from '@/shared/get-table-data';
import getTablesMetadata from '@/shared/get-tables-metadata';
import { nonEmptyString } from '@/shared/schemas/non-empty-string';

import styles from './page.module.css';

type TablePageProperties = {
  params: Promise<unknown>;
};

const parametersSchema = object({
  page: string().transform((page) => (page ? Number.parseInt(page) : 1)),
  tableId: nonEmptyString,
});

export async function generateMetadata({ params }: TablePageProperties) {
  const { page, tableId } = parametersSchema.parse(await params);
  const item = await getTableMetadata(tableId);
  if (!item) return {};
  return generateIndexationMetadata(item, page);
}

export default async function Table({ params }: TablePageProperties) {
  const gotParameters = await params;
  const { page, tableId } = parametersSchema.parse(gotParameters);
  const tableMetadata = await getTableMetadata(tableId);
  const tableData = await getTableData(tableMetadata);
  const tableDataToDisplay = tableData.slice(
    (page - 1) * PER_PAGE,
    page * PER_PAGE,
  );
  if (tableData.length === 0 || !tableMetadata) {
    throw new Error('Table not found');
  }
  const sourcesLinks = tableMetadata.sources
    .map((source) => <SourceLink key={source} href={source} />)
    // eslint-disable-next-line unicorn/no-array-reduce
    .reduce(
      (previous, current) => [...previous, ', ', current],
      [] as ReactNode[],
    );
  void sourcesLinks.shift(); // remove first comma

  const jsonLd = page === 1 ? generateJsonLd(tableMetadata) : null;

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
            Виконавець індексації:{' '}
            {tableMetadata.author ? (
              <ContactGate contact={tableMetadata.author} />
            ) : (
              'народ України'
            )}
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
              center={tableMetadata.location}
              points={combinedPoints}
              zoom={8}
            />
          </Details>
        </section>
        <section>
          <h2 id="table-data">Дані</h2>
          <Pagination
            currentPage={page}
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
              page={page}
              tableId={tableId}
            />
          </div>
        </section>
      </article>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        ></script>
      )}
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
