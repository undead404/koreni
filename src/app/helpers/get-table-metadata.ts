import { readFile } from "node:fs/promises";
import path from "node:path";

import { parse } from "yaml";

import {
  indexationTableSchema,
  type IndexationTable,
} from "@/shared/schemas/indexation-table";

export default async function getTableMetadata(
  tableId: string
): Promise<IndexationTable> {
  const yamlFilepath = path.resolve(`./data/tables/${tableId}.yml`)
  const fileContent = await readFile(yamlFilepath, "utf-8");
  const tableMetadata = parse(fileContent);
  return indexationTableSchema.parse(tableMetadata);
}
