import { access, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parse as parseCsv } from 'csv-parse/sync';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';

import environment from '../environment.js';
import { logger } from '../logger.js';

const tableMetadataSchema = z.object({
  authorEmail: z.string().optional(),
  tableFilePath: z.string().min(1),
  title: z.string().min(1),
});
const csvRowsSchema = z.array(z.array(z.unknown()));
const karmaStatsSchema = z.object({
  contribution: z.number().int().nonnegative(),
  rowCount: z.number().int().nonnegative(),
  tableCount: z.number().int().nonnegative(),
});
const karmaStatsIndexSchema = z.object({
  generatedAt: z.string().min(1),
  revision: z.string().min(1),
  version: z.literal(1),
  users: z.record(z.email(), karmaStatsSchema),
});

export type KarmaCalculationLogContext = { requestId: string };
export type KarmaStats = z.infer<typeof karmaStatsSchema>;
export type KarmaStatsIndex = z.infer<typeof karmaStatsIndexSchema>;

export class KarmaSourceUnavailableError extends Error {
  constructor() {
    super('Karma source unavailable');
    this.name = 'KarmaSourceUnavailableError';
  }
}

const indexPath = path.resolve(
  environment.KARMA_STATS_PATH ??
    path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      '../generated/karma-stats.json',
    ),
);
let cachedIndex: KarmaStatsIndex | null = null;
let localStatsCache: { expiresAt: number; stats: KarmaStatsIndex } | null =
  null;
let sourceRefresh: Promise<KarmaStatsIndex> | null = null;

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

function stringifyCellValue(value: unknown): string {
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

function calculateRows(rows: Array<unknown[]>): {
  contribution: number;
  rowCount: number;
} {
  const values = new Set<string>();
  for (const row of rows) {
    for (const value of row) {
      if (!value) continue;
      const stringValue = stringifyCellValue(value).trim();
      if (stringValue) values.add(stringValue);
    }
  }
  return {
    contribution: [...values].reduce((sum, value) => sum + value.length, 0),
    rowCount: rows.filter((row) =>
      row.some((value) => /\p{L}/u.test(stringifyCellValue(value))),
    ).length,
  };
}

function applyAiWeight(contribution: number, title: string): number {
  return title.startsWith('[ШІ] ') || title.startsWith('[ШI] ')
    ? Math.floor(contribution * 0.1)
    : contribution;
}

async function getRecordPaths(recordsPath: string): Promise<string[]> {
  const entries = await readdir(recordsPath, { withFileTypes: true });
  return entries
    .filter(
      (entry) =>
        entry.isFile() &&
        (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml')),
    )
    .map((entry) => path.join(recordsPath, entry.name))
    .sort((a, b) => a.localeCompare(b));
}

export async function calculateLocalKarmaStats(
  dataRoot: string,
  revision = 'development',
): Promise<KarmaStatsIndex> {
  const users: Record<string, KarmaStats> = {};
  const recordPaths = await getRecordPaths(path.join(dataRoot, 'records'));

  for (const recordPath of recordPaths) {
    const metadata = tableMetadataSchema.parse(
      parseYaml(await readFile(recordPath, 'utf8')),
    );
    const email = metadata.authorEmail
      ? normalizeEmail(metadata.authorEmail)
      : '';
    if (!email) continue;

    const csvPath = path.resolve(dataRoot, '..', metadata.tableFilePath);
    const rows = csvRowsSchema
      .parse(
        parseCsv(await readFile(csvPath, 'utf8'), {
          relax_quotes: true,
          relax_column_count: true,
          skip_empty_lines: true,
        }),
      )
      .slice(1);
    const rowStats = calculateRows(rows);
    const current = users[email] ?? {
      contribution: 0,
      rowCount: 0,
      tableCount: 0,
    };
    users[email] = {
      contribution:
        current.contribution +
        applyAiWeight(rowStats.contribution, metadata.title),
      rowCount: current.rowCount + rowStats.rowCount,
      tableCount: current.tableCount + 1,
    };
  }

  return {
    generatedAt: new Date().toISOString(),
    revision,
    users,
    version: 1,
  };
}

async function loadProductionIndex(): Promise<KarmaStatsIndex> {
  if (cachedIndex) return cachedIndex;
  try {
    cachedIndex = karmaStatsIndexSchema.parse(
      JSON.parse(await readFile(indexPath, 'utf8')) as unknown,
    );
    return cachedIndex;
  } catch (error) {
    logger.error('karma.index-load-failed', { error });
    throw new KarmaSourceUnavailableError();
  }
}

async function loadSource(): Promise<KarmaStatsIndex> {
  if (environment.NODE_ENV === 'production') return loadProductionIndex();
  const now = Date.now();
  if (localStatsCache && localStatsCache.expiresAt > now) {
    return localStatsCache.stats;
  }
  const dataRoot = await resolveDevelopmentDataRoot();
  const stats = await calculateLocalKarmaStats(dataRoot);
  localStatsCache = { expiresAt: now + 1000, stats };
  return stats;
}

export async function resolveDevelopmentDataRoot(): Promise<string> {
  if (environment.KARMA_DATA_ROOT) return environment.KARMA_DATA_ROOT;

  const currentDirectoryDataRoot = path.resolve(process.cwd(), 'data');
  try {
    await access(currentDirectoryDataRoot);
    return currentDirectoryDataRoot;
  } catch {
    return path.resolve(process.cwd(), '..', '..', 'data');
  }
}

async function getSource(): Promise<KarmaStatsIndex> {
  if (!sourceRefresh) {
    sourceRefresh = loadSource().finally(() => {
      sourceRefresh = null;
    });
  }
  return sourceRefresh;
}

export async function getUserKarmaStats(
  email: string,
  context: KarmaCalculationLogContext,
): Promise<KarmaStats> {
  void context;
  const index = await getSource();
  return (
    index.users[normalizeEmail(email)] ?? {
      contribution: 0,
      rowCount: 0,
      tableCount: 0,
    }
  );
}

export async function getAllKarmaStats(): Promise<KarmaStatsIndex> {
  return getSource();
}

export async function getKarmaStatsMetadata(): Promise<
  Pick<KarmaStatsIndex, 'generatedAt' | 'revision' | 'version'>
> {
  const index = await getSource();
  return {
    generatedAt: index.generatedAt,
    revision: index.revision,
    version: index.version,
  };
}

export async function writeKarmaStatsIndex(
  outputPath: string,
  dataRoot: string,
  revision: string,
): Promise<void> {
  const index = await calculateLocalKarmaStats(dataRoot, revision);
  await writeFile(outputPath, `${JSON.stringify(index)}\n`, 'utf8');
}

export function resetKarmaMetadataCache(): void {
  cachedIndex = null;
  localStatsCache = null;
  sourceRefresh = null;
}
