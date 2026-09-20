import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { parse as parseCsv } from 'csv-parse/sync';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';

const metadataSchema = z.object({
  authorEmail: z.string().optional(),
  tableFilePath: z.string().min(1),
  title: z.string().min(1),
});
const rowsSchema = z.array(z.array(z.unknown()));

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

function stringifyCell(value: unknown): string {
  if (typeof value === 'object') return JSON.stringify(value);
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
  const value = stringifyCell(cell).trim();
  if (value) values.add(value);
}

function rowStats(rows: Array<unknown[]>): {
  contribution: number;
  rowCount: number;
} {
  const values = new Set<string>();
  for (const row of rows) {
    for (const cell of row) {
      addCellValue(values, cell);
    }
  }
  return {
    contribution: [...values].reduce((sum, value) => sum + value.length, 0),
    rowCount: rows.filter((row) =>
      row.some((cell) => /\p{L}/u.test(stringifyCell(cell))),
    ).length,
  };
}

export async function generateKarmaStats(
  dataRoot: string,
  outputPath: string,
  revision: string,
): Promise<void> {
  const users: Record<
    string,
    { contribution: number; rowCount: number; tableCount: number }
  > = {};
  const recordsPath = path.join(dataRoot, 'records');
  const recordEntries = await readdir(recordsPath);
  const recordNames = recordEntries
    .filter((name) => name.endsWith('.yaml') || name.endsWith('.yml'))
    .toSorted((a, b) => a.localeCompare(b));

  for (const recordName of recordNames) {
    const metadataContent = await readFile(
      path.join(recordsPath, recordName),
      'utf8',
    );
    const metadata = metadataSchema.parse(parseYaml(metadataContent));
    const email = metadata.authorEmail
      ? normalizeEmail(metadata.authorEmail)
      : '';
    if (!email) continue;

    const csvPath = path.resolve(dataRoot, '..', metadata.tableFilePath);
    const rows = rowsSchema
      .parse(
        parseCsv(await readFile(csvPath, 'utf8'), {
          relax_quotes: true,
          relax_column_count: true,
          skip_empty_lines: true,
        }),
      )
      .slice(1);
    const current = users[email] ?? {
      contribution: 0,
      rowCount: 0,
      tableCount: 0,
    };
    const stats = rowStats(rows);
    users[email] = {
      contribution:
        current.contribution +
        (metadata.title.startsWith('[ШІ] ') ||
        metadata.title.startsWith('[ШI] ')
          ? Math.floor(stats.contribution * 0.1)
          : stats.contribution),
      rowCount: current.rowCount + stats.rowCount,
      tableCount: current.tableCount + 1,
    };
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    `${JSON.stringify({
      generatedAt: new Date().toISOString(),
      revision,
      users,
      version: 1,
    })}\n`,
    'utf8',
  );
}

const invokedPath = process.argv[1];
if (invokedPath && import.meta.url === pathToFileURL(invokedPath).href) {
  const dataRoot = process.argv[2];
  const outputPath = process.argv[3];
  if (!dataRoot || !outputPath) {
    throw new Error(
      'Usage: generate-karma-stats <data-root> <output-path> [revision]',
    );
  }
  const revision = process.argv[4] || process.env.GITHUB_SHA || 'development';
  await generateKarmaStats(dataRoot, outputPath, revision);
}
