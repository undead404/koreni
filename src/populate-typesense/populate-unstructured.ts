import _ from 'lodash';

import type { IndexationTable } from '../shared/schemas/indexation-table.js';

import determineRowYear from './determine-row-year.js';
import typesense from './typesense.js';

const CHUNK_SIZE = 1000;

export interface IndexationTableWithData extends IndexationTable {
  data: Record<string, unknown>[];
}

export default async function populateTypesense(
  table: IndexationTableWithData,
) {
  const { data, location, tableLocale: locale } = table;
  const dataWithExtraFields = data.map((row, index) => ({
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
    await typesense
      .collections('unstructured_' + locale)
      .documents()
      .import(chunk, { action: 'upsert' });
  }
}
