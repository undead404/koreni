import type { IndexationTable } from '@/shared/schemas/indexation-table.js';

import determineRowYear from './determine-row-year.js';

export default function convertRow(
  row: Record<string, unknown>,
  number: number,
  table: IndexationTable,
  location: [number, number],
) {
  // Extract discrete values into an array, discarding the arbitrary column names
  const rowValues = Object.values(row)
    // .filter((value) => value != null && value !== '')
    .map((value) => String(value).trim());

  return {
    id: `${table.id}-${number + 1}`,
    location,
    tableId: table.id,
    title: table.title,
    year: determineRowYear(row, table),

    // Indexed: Array of discrete strings for accurate Typesense tokenization
    values: rowValues,

    // Unindexed: Stored strictly for NextJS frontend rendering of the original table structure
    raw: row,
  };
}
