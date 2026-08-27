import path from 'node:path';

import getTablesMetadata from '../shared/get-tables-metadata.js';
import readCsv from '../shared/read-csv-data.js';

function stringifyCellValue(value: unknown): string {
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint' ||
    typeof value === 'symbol'
  ) {
    return value.toString();
  }
  return '';
}

function addCellValue(values: Set<string>, cell: unknown): void {
  if (!cell) return;
  const trimmedValue = stringifyCellValue(cell).trim();
  if (trimmedValue.length > 0) values.add(trimmedValue);
}

export async function calculateKarmaContributions(): Promise<
  Map<string, number>
> {
  const result = new Map<string, number>();
  const tables = await getTablesMetadata();

  for (const table of tables) {
    if (!table.authorEmail) {
      continue;
    }

    const normalizedEmail = table.authorEmail.toLowerCase().trim();
    if (!normalizedEmail) {
      continue;
    }

    // eslint-disable-next-line no-useless-assignment
    let rows: Record<string, unknown>[] = [];
    try {
      const fullCsvPath = path.join(process.cwd(), table.tableFilePath);
      rows = await readCsv(fullCsvPath);
    } catch {
      continue;
    }

    const cellValues = new Set<string>();
    for (const row of rows) {
      for (const value of Object.values(row)) {
        addCellValue(cellValues, value);
      }
    }

    let tableSum = 0;
    for (const value of cellValues) {
      tableSum += value.length;
    }

    if (table.title.startsWith('[ШІ] ') || table.title.startsWith('[ШI] ')) {
      tableSum = Math.floor(tableSum * 0.1);
    }

    result.set(normalizedEmail, (result.get(normalizedEmail) ?? 0) + tableSum);
  }

  return result;
}

export async function getUserKarmaContribution(email: string): Promise<number> {
  const normalizedEmail = email.toLowerCase().trim();
  if (!normalizedEmail) {
    return 0;
  }

  const contributionsMap = await calculateKarmaContributions();
  return contributionsMap.get(normalizedEmail) ?? 0;
}
