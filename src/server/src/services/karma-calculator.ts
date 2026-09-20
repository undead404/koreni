import { logger } from '../logger.js';

import * as karmaSource from './karma-source.js';

export { KarmaSourceUnavailableError } from './karma-source.js';

type KarmaCalculationLogContext = karmaSource.KarmaCalculationLogContext;

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
  const stats = await karmaSource.getUserKarmaStats(normalizedEmail, context);
  logKarmaEvent('records-selected', context, {
    duration_ms: durationSince(startedAt),
    matching_record_count: stats.tableCount,
  });
  logKarmaEvent('calculation-completed', context, {
    csv_count: stats.tableCount,
    duration_ms: durationSince(startedAt),
    matching_record_count: stats.tableCount,
    outcome: 'success',
    shared_in_flight: false,
  });
  return {
    contribution: stats.contribution,
    rowCount: stats.rowCount,
    tableCount: stats.tableCount,
  };
}

export async function getUserKarmaContribution(
  email: string,
  context?: KarmaCalculationLogContext,
): Promise<number> {
  const logContext = context ?? { requestId: 'internal' };
  const normalizedEmail = email.toLowerCase().trim();
  if (!normalizedEmail) {
    return 0;
  }

  const existingRefresh = userContributionRefreshes.get(normalizedEmail);
  if (existingRefresh) {
    logKarmaEvent('calculation-shared', logContext, { shared_in_flight: true });
    const summary = await existingRefresh;
    return summary.contribution;
  }

  const refresh = (async () => {
    try {
      return await calculateUserKarmaSummary(normalizedEmail, logContext);
    } catch (error: unknown) {
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
    } finally {
      userContributionRefreshes.delete(normalizedEmail);
    }
  })();
  userContributionRefreshes.set(normalizedEmail, refresh);
  const summary = await refresh;
  return summary.contribution;
}

export async function getUserKarmaContributionStats(
  email: string,
  context?: KarmaCalculationLogContext,
): Promise<KarmaContributionStats> {
  const logContext = context ?? { requestId: 'internal' };
  const normalizedEmail = email.toLowerCase().trim();
  if (!normalizedEmail) {
    return { rowCount: 0, tableCount: 0 };
  }

  const existingRefresh = userContributionRefreshes.get(normalizedEmail);
  if (existingRefresh) {
    const { rowCount, tableCount } = await existingRefresh;
    return {
      rowCount,
      tableCount,
    };
  }

  const refresh = (async () => {
    try {
      return await calculateUserKarmaSummary(normalizedEmail, logContext);
    } catch (error: unknown) {
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
    } finally {
      userContributionRefreshes.delete(normalizedEmail);
    }
  })();
  userContributionRefreshes.set(normalizedEmail, refresh);
  const { rowCount, tableCount } = await refresh;
  return { rowCount, tableCount };
}

export async function calculateKarmaContributions(): Promise<
  Map<string, number>
> {
  const index = await karmaSource.getAllKarmaStats();
  const result = new Map<string, number>();
  for (const [email, stats] of Object.entries(index.users)) {
    result.set(email, stats.contribution);
  }
  return result;
}
