import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { parse as parseCsv } from 'csv-parse/sync';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';

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

async function getRecordsMetadataAndData(): Promise<ParsedTableRecord[]> {
  const recordsDirectory = path.join(process.cwd(), 'data', 'records');
  let yamlFiles: string[] = [];
  try {
    const entries = await readdir(recordsDirectory);
    yamlFiles = entries.filter(
      (file) => file.endsWith('.yaml') || file.endsWith('.yml'),
    );
  } catch {
    return [];
  }

  const results: ParsedTableRecord[] = [];

  for (const file of yamlFiles) {
    try {
      const yamlPath = path.join(recordsDirectory, file);
      const yamlContent = await readFile(yamlPath, 'utf8');
      const parsedYaml: unknown = parseYaml(yamlContent);
      const meta = yamlMetaSchema.parse(parsedYaml);

      if (!meta.authorEmail || !meta.tableFilePath) {
        continue;
      }

      const csvPath = path.join(process.cwd(), meta.tableFilePath);
      const csvContent = await readFile(csvPath, 'utf8');
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

export async function getUserKarmaContribution(email: string): Promise<number> {
  const normalizedEmail = email.toLowerCase().trim();
  if (!normalizedEmail) {
    return 0;
  }

  const records = await getRecordsMetadataAndData();
  let total = 0;

  for (const record of records) {
    if (record.authorEmail === normalizedEmail) {
      const cellValues = new Set<string>();
      for (const row of record.rows) {
        for (const value of Object.values(row)) {
          if (typeof value === 'string') {
            const string_ = value.trim();
            if (string_.length > 0) {
              cellValues.add(string_);
            }
          } else if (typeof value === 'number' || typeof value === 'boolean') {
            const string_ = String(value).trim();
            if (string_.length > 0) {
              cellValues.add(string_);
            }
          }
        }
      }

      let tableSum = 0;
      for (const value of cellValues) {
        tableSum += value.length;
      }

      const isAi =
        record.title.startsWith('[ШІ] ') || record.title.startsWith('[ШI] ');
      if (isAi) {
        tableSum = Math.floor(tableSum * 0.1);
      }

      total += tableSum;
    }
  }

  return total;
}

export async function calculateKarmaContributions(): Promise<
  Map<string, number>
> {
  const result = new Map<string, number>();
  const records = await getRecordsMetadataAndData();

  for (const record of records) {
    if (!record.authorEmail) continue;

    const cellValues = new Set<string>();
    for (const row of record.rows) {
      for (const value of Object.values(row)) {
        if (typeof value === 'string') {
          const string_ = value.trim();
          if (string_.length > 0) {
            cellValues.add(string_);
          }
        } else if (typeof value === 'number' || typeof value === 'boolean') {
          const string_ = String(value).trim();
          if (string_.length > 0) {
            cellValues.add(string_);
          }
        }
      }
    }

    let tableSum = 0;
    for (const value of cellValues) {
      tableSum += value.length;
    }

    const isAi =
      record.title.startsWith('[ШІ] ') || record.title.startsWith('[ШI] ');
    if (isAi) {
      tableSum = Math.floor(tableSum * 0.1);
    }

    const current = result.get(record.authorEmail) || 0;
    result.set(record.authorEmail, current + tableSum);
  }

  return result;
}
