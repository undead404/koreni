import _ from 'lodash';
import Head from 'next/head';
import { object, string } from 'zod';

import { PER_PAGE } from '@/app/constants';
import environment from '@/app/environment';
import {
  generateIndexationMetadata,
  generateJsonLd,
} from '@/app/helpers/generate-metadata';
import getTableMetadata from '@/app/helpers/get-table-metadata';
import getTableData from '@/shared/get-table-data';
import getTablesMetadata from '@/shared/get-tables-metadata';
import { nonEmptyString } from '@/shared/schemas/non-empty-string';

import TableContent from './table-content';

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
      <TableContent
        tableMetadata={tableMetadata}
        tableData={tableDataToDisplay}
        page={page}
        tableId={tableId}
        totalRecords={tableData.length}
        jsonLd={jsonLd}
      />
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
