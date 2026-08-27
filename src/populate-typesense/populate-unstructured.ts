import { chunk } from 'es-toolkit';

import convertRow from './convert-row.js';
import importBatch from './import-batch.js';
import type { IndexationTableWithData, RowForImport } from './types.js';

const CHUNK_SIZE = 1000;

export default async function populateTypesense(
  table: IndexationTableWithData,
) {
  const { data, location, tableLocale: locale } = table;
  const tableSize = data.length;
  const dataWithExtraFields: RowForImport[] = data.map((row, index) =>
    convertRow(row, index, table, location),
  );
  const chunks = chunk(dataWithExtraFields, CHUNK_SIZE);
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
