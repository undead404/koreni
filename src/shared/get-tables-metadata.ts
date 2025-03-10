import { readFile } from 'node:fs/promises';

import { sortBy } from 'lodash';
import { parse } from 'yaml';

import {
  type IndexationTable,
  indexationTableSchema,
} from './schemas/indexation-table';
import getYamlFilepaths from './get-yaml-filepaths';
import validateMetadata from './validate-metadata';

const TABLES_FOLDER = './data/tables';

export default async function getTablesMetadata(): Promise<IndexationTable[]> {
  const yamlFilepaths = await getYamlFilepaths(TABLES_FOLDER);
  const tablesMetadata: IndexationTable[] = [];
  for (const yamlFilepath of yamlFilepaths) {
    const fileContent = await readFile(yamlFilepath, 'utf8');
    const tableMetadata = indexationTableSchema.parse(parse(fileContent));
    tablesMetadata.push(tableMetadata);
  }
  validateMetadata(tablesMetadata);
  return sortBy(tablesMetadata, 'id');
}
