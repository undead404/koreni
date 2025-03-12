import _ from 'lodash';

import determineRowYear from './determine-row-year.js';
import importBatch from './import-batch.js';
import type { IndexationTableWithData, RowForImport } from './types.js';

const CHUNK_SIZE = 1000;

export default async function populateTypesense(
  table: IndexationTableWithData,
) {
  const { data, location, tableLocale: locale } = table;
  const dataWithExtraFields: RowForImport[] = data.map((row, index) => ({
    data: row,
    id: `${table.id}-${index + 1}`,
    location,
    tableId: table.id,
    title: table.title,
    year: determineRowYear(row, table),
  }));
  const chunks = _.chunk(dataWithExtraFields, CHUNK_SIZE);
  for (const [index, chunk] of chunks.entries()) {
    console.log(`Chunk # ${index + 1}`);
    await importBatch(`unstructured_${locale}`, chunk);
  }
}
