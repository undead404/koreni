import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { parse } from 'yaml';

import {
  type IndexationTable,
  indexationTableSchema,
} from '@/shared/schemas/indexation-table';

export default async function getTableMetadata(
  tableId: string,
): Promise<IndexationTable> {
  const yamlFilepath = path.resolve(`./data/tables/${tableId}.yml`);
  const fileContent = await readFile(yamlFilepath, 'utf8');
  const tableMetadata = indexationTableSchema.parse(parse(fileContent));
  return tableMetadata;
}
