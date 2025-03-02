import type { IndexationTable } from "./get-tables-metadata";
import readCsv from "./read-csv-data";

export default async function getTableData(
  tableMetadata: IndexationTable
): Promise<Record<string, unknown>[]> {
  // name of a CSV file
  const fileName = tableMetadata.tableFilename;
  const data = await readCsv(`./data/tables/${fileName}`);
  return data;
}
