import _ from 'lodash';

import { Details } from '@/app/components/details';
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
        <h2>Метадані</h2>
        <p>Виконавець індексації: {tableMetadata.author || 'народ України'}</p>
        <p>
          Джерела:{' '}
          {tableMetadata.sources.map((source) => (
            <a key={source} href={source}>
              {source}
            </a>
          ))}
        </p>
        {tableMetadata.archiveItems && (
          <Details summary={<h3>Використані архівні справи</h3>}>
            <ul>
              {tableMetadata.archiveItems.map((archiveItem) => (
                <li key={archiveItem}>{archiveItem}</li>
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
        <h2>Дані</h2>
        <Pagination
          currentPage={pageInt}
          totalPages={Math.ceil(tableData.length / PER_PAGE)}
          urlBuilder={(page: number) => `/${tableId}/${page}`}
        />
        <div className={styles.tableContainer}>
          <IndexTable
            data={tableDataToDisplay}
            locale={tableMetadata.tableLocale}
            page={pageInt}
            tableId={tableId}
          />
        </div>
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
