import { readFile } from "node:fs/promises";

import { parse } from "yaml";

import {
  indexationTableSchema,
  type IndexationTable,
} from "@/shared/schemas/indexation-table";
import path from "node:path";

export default async function getTableMetadata(
  tableFilename: string
): Promise<IndexationTable> {
  const yamlFilepath = path.resolve(`./data/tables/${tableFilename}.yml`)
  const fileContent = await readFile(yamlFilepath, "utf-8");
  const tableMetadata = parse(fileContent);
  return indexationTableSchema.parse(tableMetadata);
}
