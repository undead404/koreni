import { logger } from '../logger.js';

import * as karmaSource from './karma-source.js';

export { KarmaSourceUnavailableError } from './karma-source.js';

type KarmaCalculationLogContext = karmaSource.KarmaCalculationLogContext;

interface ParsedTableRecord {
  authorEmail: string;
  rows: Array<unknown[]>;
  tableFilePath: string;
  title: string;
}

export interface KarmaContributionStats {
  tableCount: number;
  rowCount: number;
}

interface UserKarmaSummary extends KarmaContributionStats {
  contribution: number;
}

const userContributionRefreshes = new Map<string, Promise<UserKarmaSummary>>();

function durationSince(start: number): number {
  return Math.max(0, Math.round(performance.now() - start));
}

function safeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replaceAll(/[\w.%+-]+@[\w.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .slice(0, 300);
}

function logKarmaEvent(
  event: string,
  context: KarmaCalculationLogContext,
  fields: Record<string, boolean | number | string>,
): void {
  try {
    logger.info(`karma.${event}`, { request_id: context.requestId, ...fields });
  } catch {
    // Observability must never affect the calculation.
  }
}

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

function calculateRecordContribution(record: ParsedTableRecord): number {
  const cellValues = new Set<string>();
  for (const row of record.rows) {
    for (const value of Object.values(row)) {
      if (!value) {
        continue;
      }

      const stringValue = stringifyCellValue(value);
      const trimmedValue = stringValue.trim();
      if (trimmedValue.length > 0) {
        cellValues.add(trimmedValue);
      }
    }
  }

  const tableSum = [...cellValues].reduce(
    (sum, value) => sum + value.length,
    0,
  );
  const isAi =
    record.title.startsWith('[ШІ] ') || record.title.startsWith('[ШI] ');

  return isAi ? Math.floor(tableSum * 0.1) : tableSum;
}

function countRowsContainingLetters(rows: Array<unknown[]>): number {
  return rows.filter((row) =>
    row.some((value) => /\p{L}/u.test(stringifyCellValue(value))),
  ).length;
}

export function resetKarmaMetadataCache(): void {
  karmaSource.resetKarmaMetadataCache();
  userContributionRefreshes.clear();
}

async function calculateUserKarmaSummary(
  normalizedEmail: string,
  context: KarmaCalculationLogContext,
): Promise<UserKarmaSummary> {
  const startedAt = performance.now();
  logKarmaEvent('calculation-started', context, {});
  const records = await karmaSource.getCachedRecordsMetadata(context);
  const matchingRecords = records.filter(
    (record) => record.authorEmail === normalizedEmail,
  );
  logKarmaEvent('records-selected', context, {
    duration_ms: durationSince(startedAt),
    matching_record_count: matchingRecords.length,
  });
  const csvStartedAt = performance.now();
  let total = 0;
  let rowCount = 0;
  for (const record of matchingRecords) {
    const rows = await karmaSource.readRows(record.tableFilePath, context);
    total += calculateRecordContribution({
      ...record,
      rows,
    });
    rowCount += countRowsContainingLetters(rows);
  }
  logKarmaEvent('csv-completed', context, {
    csv_count: matchingRecords.length,
    duration_ms: durationSince(csvStartedAt),
  });
  logKarmaEvent('calculation-completed', context, {
    csv_count: matchingRecords.length,
    duration_ms: durationSince(startedAt),
    matching_record_count: matchingRecords.length,
    outcome: 'success',
    shared_in_flight: false,
  });
  return {
    contribution: total,
    rowCount,
    tableCount: matchingRecords.length,
  };
}

export function getUserKarmaContribution(
  email: string,
  context?: KarmaCalculationLogContext,
): Promise<number> {
  const logContext = context ?? { requestId: 'internal' };
  const normalizedEmail = email.toLowerCase().trim();
  if (!normalizedEmail) {
    return Promise.resolve(0);
  }

  const existingRefresh = userContributionRefreshes.get(normalizedEmail);
  if (existingRefresh) {
    logKarmaEvent('calculation-shared', logContext, { shared_in_flight: true });
    return existingRefresh.then(({ contribution }) => contribution);
  }

  const refresh = calculateUserKarmaSummary(normalizedEmail, logContext)
    .catch((error: unknown) => {
      logKarmaEvent('calculation-failed', logContext, {
        error_category:
          error instanceof karmaSource.KarmaSourceUnavailableError
            ? 'external_source_unavailable'
            : 'internal_error',
        error_message: safeErrorMessage(error),
        error_name: error instanceof Error ? error.name : 'UnknownError',
        outcome: 'failure',
      });
      throw error;
    })
    .finally(() => {
      userContributionRefreshes.delete(normalizedEmail);
    });
  userContributionRefreshes.set(normalizedEmail, refresh);
  return refresh.then(({ contribution }) => contribution);
}

export function getUserKarmaContributionStats(
  email: string,
  context?: KarmaCalculationLogContext,
): Promise<KarmaContributionStats> {
  const logContext = context ?? { requestId: 'internal' };
  const normalizedEmail = email.toLowerCase().trim();
  if (!normalizedEmail) {
    return Promise.resolve({ rowCount: 0, tableCount: 0 });
  }

  const existingRefresh = userContributionRefreshes.get(normalizedEmail);
  if (existingRefresh) {
    return existingRefresh.then(({ rowCount, tableCount }) => ({
      rowCount,
      tableCount,
    }));
  }

  const refresh = calculateUserKarmaSummary(normalizedEmail, logContext)
    .catch((error: unknown) => {
      logKarmaEvent('calculation-failed', logContext, {
        error_category:
          error instanceof karmaSource.KarmaSourceUnavailableError
            ? 'external_source_unavailable'
            : 'internal_error',
        error_message: safeErrorMessage(error),
        error_name: error instanceof Error ? error.name : 'UnknownError',
        outcome: 'failure',
      });
      throw error;
    })
    .finally(() => {
      userContributionRefreshes.delete(normalizedEmail);
    });
  userContributionRefreshes.set(normalizedEmail, refresh);
  return refresh.then(({ rowCount, tableCount }) => ({ rowCount, tableCount }));
}

export async function calculateKarmaContributions(): Promise<
  Map<string, number>
> {
  const metadata = await karmaSource.getCachedRecordsMetadata({
    requestId: 'internal',
  });
  const records: ParsedTableRecord[] = [];
  for (const record of metadata) {
    records.push({
      ...record,
      rows: await karmaSource.readRows(record.tableFilePath, {
        requestId: 'internal',
      }),
    });
  }
  const result = new Map<string, number>();
  for (const record of records) {
    result.set(
      record.authorEmail,
      (result.get(record.authorEmail) ?? 0) +
        calculateRecordContribution(record),
    );
  }
  return result;
}
