import _ from 'lodash';

import type { IndexationTable } from '../shared/schemas/indexation-table.js';
import typesense from './typesense.js';

const CHUNK_SIZE = 100;

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
    sources: table.sources,
    title: table.title,
  }));
  const chunks = _.chunk(dataWithExtraFields, CHUNK_SIZE);
  for (let i = 0; i < chunks.length; i += 1) {
    console.log(`Chunk # ${i + 1}`);
    await typesense
      .collections('unstructured_' + locale)
      .documents()
      .import(chunks[i]!, { action: 'upsert' });
  }
}
