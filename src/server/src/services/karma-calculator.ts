import { parse as parseCsv } from 'csv-parse/sync';
import { Octokit } from 'octokit';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';

import environment from '../environment.js';

const yamlMetaSchema = z.object({
  authorEmail: z.string().optional(),
  tableFilePath: z.string().optional(),
  title: z.string().optional(),
});

const csvRowsSchema = z.array(z.record(z.string(), z.unknown()));

interface ParsedTableRecord {
  authorEmail: string;
  rows: Array<Record<string, unknown>>;
  title: string;
}

const octokit = new Octokit({ auth: environment.GITHUB_TOKEN });

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

async function readGithubFile(filePath: string): Promise<string> {
  const response = await fetch(
    `https://raw.githubusercontent.com/${environment.GITHUB_REPO}/main/${filePath}`,
  );
  if (!response.ok) {
    throw new Error(`Unable to read GitHub source file: ${filePath}`);
  }
  return response.text();
}

async function getRecordsMetadataAndData(): Promise<ParsedTableRecord[]> {
  const [owner, repo] = environment.GITHUB_REPO.split('/');
  let yamlFiles: string[];
  try {
    const response = await octokit.rest.repos.getContent({
      owner,
      path: 'data/records',
      repo,
      ref: 'main',
    });
    if (!Array.isArray(response.data)) {
      return [];
    }
    yamlFiles = response.data
      .filter(
        (entry) =>
          entry.type === 'file' &&
          (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml')),
      )
      .map((entry) => entry.path);
  } catch {
    return [];
  }

  const results: ParsedTableRecord[] = [];

  for (const file of yamlFiles) {
    try {
      const yamlContent = await readGithubFile(file);
      const parsedYaml: unknown = parseYaml(yamlContent);
      const meta = yamlMetaSchema.parse(parsedYaml);

      if (!meta.authorEmail || !meta.tableFilePath) {
        continue;
      }

      const csvContent = await readGithubFile(meta.tableFilePath);
      const parsedCsv: unknown = parseCsv(csvContent, {
        columns: true,
        skip_empty_lines: true,
      });
      const rows = csvRowsSchema.parse(parsedCsv);

      results.push({
        authorEmail: meta.authorEmail.toLowerCase().trim(),
        rows,
        title: meta.title || '',
      });
    } catch {
      // Ignore invalid files
    }
  }

  return results;
}

function calculateRecordContribution(record: ParsedTableRecord): number {
  const cellValues = new Set<string>();
  for (const row of record.rows) {
    for (const value of Object.values(row)) {
      if (value === null || value === undefined) {
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

export async function getUserKarmaContribution(email: string): Promise<number> {
  const normalizedEmail = email.toLowerCase().trim();
  if (!normalizedEmail) {
    return 0;
  }

  const records = await getRecordsMetadataAndData();
  return records
    .filter((record) => record.authorEmail === normalizedEmail)
    .reduce((total, record) => total + calculateRecordContribution(record), 0);
}

export async function calculateKarmaContributions(): Promise<
  Map<string, number>
> {
  const records = await getRecordsMetadataAndData();
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
