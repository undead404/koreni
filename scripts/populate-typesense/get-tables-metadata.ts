import { parse } from "yaml";
import { z } from "zod";

import getYamlFilepaths from "./get-yaml-filepaths";
import { readFile } from "fs/promises";

const TABLES_FOLDER = "./data/tables";

const indexationTableSchema = z.object({
  tableFilename: z.string().nonempty(),
  location: z.tuple([z.number(), z.number()]),
  sources: z.array(z.string().nonempty()),
  title: z.string().nonempty(),
  tableLocale: z.enum(["ru", "uk"]),
});

export type IndexationTable = z.infer<typeof indexationTableSchema>;

export default async function getTablesMetadata(): Promise<IndexationTable[]> {
  const yamlFilepaths = await getYamlFilepaths(TABLES_FOLDER);
  console.log(yamlFilepaths);
  const tablesMetadata: IndexationTable[] = [];
  for (const yamlFilepath of yamlFilepaths) {
    const fileContent = await readFile(yamlFilepath, "utf-8");
    const tableMetadata = parse(fileContent);
    tablesMetadata.push(indexationTableSchema.parse(tableMetadata));
  }
  return tablesMetadata;
}
