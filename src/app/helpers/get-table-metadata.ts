import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { parse } from 'yaml';

import getYamlFilepaths from '@/shared/get-yaml-filepaths';
import {
  type IndexationTable,
  indexationTableSchema,
} from '@/shared/schemas/indexation-table';
const METADATA_FOLDER = path.join(process.cwd(), 'data/records');

const yamlFilepaths = await getYamlFilepaths(METADATA_FOLDER);

export default async function getTableMetadata(
  tableId: string,
): Promise<IndexationTable> {
  const lowercaseTableId = tableId.toLowerCase();
  const yamlFilepath = yamlFilepaths.find((filepath) =>
    filepath.toLowerCase().endsWith(`${lowercaseTableId}.yaml`),
  );
  if (!yamlFilepath) {
    throw new Error('Table not found');
  }
  const fileContent = await readFile(yamlFilepath, 'utf8');
  return indexationTableSchema.parse(parse(fileContent));
}
