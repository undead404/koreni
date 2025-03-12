import _ from 'lodash';

import determineRowYear from './determine-row-year.js';
import importBatch from './import-batch.js';
import type { IndexationTableWithData, RowForImport } from './types.js';

const CHUNK_SIZE = 1000;

export default async function populateTypesense(
  table: IndexationTableWithData,
) {
  const { data, location, tableLocale: locale } = table;
  const tableSize = data.length;
  const dataWithExtraFields: RowForImport[] = data.map((row, index) => ({
    data: row,
    id: `${table.id}-${index + 1}`,
    location,
    tableId: table.id,
    title: table.title,
    year: determineRowYear(row, table),
  }));
  const chunks = _.chunk(dataWithExtraFields, CHUNK_SIZE);
  let processedSize = 0;
  for (const [index, chunk] of chunks.entries()) {
    console.log(`Chunk # ${index + 1}`);
    console.log(chunk[0].id);
    processedSize += await importBatch(`unstructured_${locale}`, chunk);
  }
  if (processedSize !== tableSize) {
    throw new Error(
      `${tableSize - processedSize} of ${tableSize} records were lost somewhere.`,
    );
  }
}
