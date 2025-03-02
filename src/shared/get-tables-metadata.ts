import { parse } from "yaml";

import getYamlFilepaths from "../populate-typesense/get-yaml-filepaths";
import { readFile } from "fs/promises";
import {
  type IndexationTable,
  indexationTableSchema,
} from "./schemas/indexation-table";

const TABLES_FOLDER = "./data/tables";

export default async function getTablesMetadata(): Promise<IndexationTable[]> {
  const yamlFilepaths = await getYamlFilepaths(TABLES_FOLDER);
  const tablesMetadata: IndexationTable[] = [];
  for (const yamlFilepath of yamlFilepaths) {
    const fileContent = await readFile(yamlFilepath, "utf-8");
    const tableMetadata = parse(fileContent);
    tablesMetadata.push(indexationTableSchema.parse(tableMetadata));
  }
  return tablesMetadata;
}
