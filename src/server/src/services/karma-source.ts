import { parse as parseCsv } from 'csv-parse/sync';
import { Octokit } from 'octokit';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';

import environment from '../environment.js';
import { logger } from '../logger.js';

const yamlMetaSchema = z.object({
  authorEmail: z.string().optional(),
  tableFilePath: z.string().optional(),
  title: z.string().optional(),
});
const csvRowsSchema = z.array(z.array(z.unknown()));
const METADATA_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const GITHUB_REQUEST_TIMEOUT_MS = 15_000;
const MAX_DIRECTORY_PAGES = 1000;

export interface KarmaCalculationLogContext {
  requestId: string;
}

interface ParsedTableRecord {
  authorEmail: string;
  rows: Array<unknown[]>;
  tableFilePath: string;
  title: string;
}

type GithubRequestPhase = 'csv' | 'directory' | 'yaml';

export class KarmaSourceUnavailableError extends Error {
  constructor() {
    super('Karma source unavailable');
    this.name = 'KarmaSourceUnavailableError';
  }
}

const octokit = new Octokit({
  auth: environment.GITHUB_TOKEN,
  request: { timeout: GITHUB_REQUEST_TIMEOUT_MS },
});

let metadataCache: {
  expiresAt: number;
  records: ParsedTableRecord[];
} | null = null;
let metadataRefresh: Promise<ParsedTableRecord[]> | null = null;

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

async function readGithubFile(
  filePath: string,
  context: KarmaCalculationLogContext,
  phase: GithubRequestPhase,
): Promise<string> {
  const startedAt = performance.now();
  logKarmaEvent('github-request-started', context, {
    method: 'GET',
    path: filePath,
    phase,
    request_kind: 'raw_file',
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, GITHUB_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://raw.githubusercontent.com/${environment.GITHUB_REPO}/main/${filePath}`,
      { signal: controller.signal },
    );
    if (!response.ok) {
      logKarmaEvent('github-request-failed', context, {
        duration_ms: durationSince(startedAt),
        error_category: 'http_error',
        http_status: response.status,
        path: filePath,
        phase,
        request_kind: 'raw_file',
      });
      throw new KarmaSourceUnavailableError();
    }
    const content = await response.text();
    logKarmaEvent('github-request-completed', context, {
      bytes_received: content.length,
      duration_ms: durationSince(startedAt),
      http_status: response.status,
      path: filePath,
      phase,
      request_kind: 'raw_file',
      status: 'success',
    });
    return content;
  } catch (error) {
    if (error instanceof KarmaSourceUnavailableError) throw error;
    logKarmaEvent('github-request-failed', context, {
      duration_ms: durationSince(startedAt),
      error_category:
        error instanceof Error && error.name === 'AbortError'
          ? 'external_source_timeout'
          : 'network_error',
      path: filePath,
      phase,
      request_kind: 'raw_file',
    });
    throw new KarmaSourceUnavailableError();
  } finally {
    clearTimeout(timeout);
  }
}

async function getRecordsMetadata(
  context: KarmaCalculationLogContext,
): Promise<ParsedTableRecord[]> {
  const startedAt = performance.now();
  const [owner, repo] = environment.GITHUB_REPO.split('/');
  const yamlFiles: string[] = [];
  let pageCount = 0;

  try {
    for (let page = 1; ; page += 1) {
      const requestStartedAt = performance.now();
      logKarmaEvent('github-request-started', context, {
        method: 'GET',
        page,
        path: 'data/records',
        phase: 'directory',
        request_kind: 'directory_api',
      });
      let response;
      try {
        response = await octokit.rest.repos.getContent({
          owner,
          path: 'data/records',
          per_page: 100,
          page,
          repo,
          ref: 'main',
        });
      } catch {
        logKarmaEvent('github-request-failed', context, {
          duration_ms: durationSince(requestStartedAt),
          error_category: 'network_error',
          page,
          path: 'data/records',
          phase: 'directory',
          request_kind: 'directory_api',
        });
        throw new KarmaSourceUnavailableError();
      }
      if (!Array.isArray(response.data)) {
        logKarmaEvent('github-request-failed', context, {
          duration_ms: durationSince(requestStartedAt),
          error_category: 'invalid_response',
          page,
          path: 'data/records',
          phase: 'directory',
          request_kind: 'directory_api',
        });
        throw new KarmaSourceUnavailableError();
      }
      const nextLink = Object.hasOwn(response, 'headers')
        ? response.headers.link
        : undefined;
      const hasNextPage =
        typeof nextLink === 'string' && nextLink.includes('rel="next"');
      logKarmaEvent('github-request-completed', context, {
        duration_ms: durationSince(requestStartedAt),
        entry_count: response.data.length,
        has_next_page: hasNextPage,
        page,
        path: 'data/records',
        phase: 'directory',
        request_kind: 'directory_api',
        status: 'success',
      });
      pageCount = page;
      yamlFiles.push(
        ...response.data
          .filter(
            (entry) =>
              entry.type === 'file' &&
              (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml')),
          )
          .map((entry) => entry.path),
      );
      if (!hasNextPage) break;
      if (page >= MAX_DIRECTORY_PAGES) throw new KarmaSourceUnavailableError();
    }
  } catch {
    logKarmaEvent('metadata-failed', context, {
      duration_ms: durationSince(startedAt),
      page_count: pageCount,
    });
    throw new KarmaSourceUnavailableError();
  }

  const results: ParsedTableRecord[] = [];
  const yamlStartedAt = performance.now();
  for (const file of yamlFiles) {
    try {
      const meta = yamlMetaSchema.parse(
        parseYaml(await readGithubFile(file, context, 'yaml')),
      );
      if (!meta.authorEmail || !meta.tableFilePath) continue;
      results.push({
        authorEmail: meta.authorEmail.toLowerCase().trim(),
        rows: [],
        title: meta.title || '',
        tableFilePath: meta.tableFilePath,
      });
    } catch (error) {
      if (error instanceof KarmaSourceUnavailableError) throw error;
    }
  }
  logKarmaEvent('metadata-completed', context, {
    duration_ms: durationSince(startedAt),
    page_count: pageCount,
    yaml_count: yamlFiles.length,
    yaml_duration_ms: durationSince(yamlStartedAt),
    metadata_record_count: results.length,
  });
  return results;
}

export async function getCachedRecordsMetadata(
  context: KarmaCalculationLogContext,
): Promise<ParsedTableRecord[]> {
  const startedAt = performance.now();
  if (metadataCache && metadataCache.expiresAt > Date.now()) {
    logKarmaEvent('metadata-cache', context, {
      cache_state: 'hit',
      duration_ms: durationSince(startedAt),
    });
    return metadataCache.records;
  }
  if (metadataRefresh) {
    logKarmaEvent('metadata-cache', context, {
      cache_state: 'in_flight',
      duration_ms: durationSince(startedAt),
    });
  } else {
    logKarmaEvent('metadata-cache', context, {
      cache_state: 'miss',
      duration_ms: durationSince(startedAt),
    });
    metadataRefresh = getRecordsMetadata(context)
      .then((records) => {
        metadataCache = {
          expiresAt: Date.now() + METADATA_CACHE_TTL_MS,
          records,
        };
        return records;
      })
      .finally(() => {
        metadataRefresh = null;
      });
  }
  return metadataRefresh;
}

export async function readRows(
  tableFilePath: string,
  context: KarmaCalculationLogContext,
): Promise<Array<unknown[]>> {
  const csvContent = await readGithubFile(tableFilePath, context, 'csv');
  try {
    const parsedCsv: unknown = parseCsv(csvContent, {
      relax_column_count: true,
      skip_empty_lines: true,
    });
    return csvRowsSchema.parse(parsedCsv).slice(1);
  } catch (error) {
    logKarmaEvent('csv-parse-failed', context, {
      error_message: safeErrorMessage(error),
      error_name: error instanceof Error ? error.name : 'UnknownError',
      phase: 'csv',
    });
    throw error;
  }
}

export function resetKarmaMetadataCache(): void {
  metadataCache = null;
  metadataRefresh = null;
}
