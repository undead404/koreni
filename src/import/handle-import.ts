import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import Papa from 'papaparse';
import yaml from 'yaml';
import { z } from 'zod';

import {
  type IndexationTable,
  indexationTableSchema,
} from '@/shared/schemas/indexation-table';

// 1. Схеми (залишаємо як були)
export const inputPayloadSchema = indexationTableSchema
  .omit({
    size: true,
    tableFilename: true,
  })
  .extend({
    date: z.coerce
      .string()
      .transform((dateString) => new Date(dateString))
      .refine((date) => !Number.isNaN(date.getTime()), {
        message: 'Invalid date format. Expected ISO string.',
      }),
    records: z.array(z.record(z.string(), z.unknown())), // Дозволяємо будь-які значення в записах
  });

// Тип для вхідних даних (виведений із Zod)
export type InputPayload = z.infer<typeof inputPayloadSchema>;

// 2. Основна логіка винесена в експортовану функцію
// rootDir дозволяє підмінити папку під час тестів
export async function handleImport(
  jsonData: unknown,
  rootDirectory: string = process.cwd(),
) {
  // Валідація
  const parsed = inputPayloadSchema.parse(jsonData);

  // Генерація шляхів
  const slugId = parsed.id; // Використовуємо id як slugId
  const csvFilename = `${slugId}.csv`;
  const yamlFilename = `${slugId}.yml`;

  const tablesDirectory = path.join(rootDirectory, 'data', 'tables');
  const metadataDirectory = tablesDirectory;
  //   const metadataDirectory = path.join(rootDirectory, 'data', 'metadata'); // або теж tables, як у вас

  // CSV
  const csvContent = Papa.unparse(parsed.records, { quotes: true });

  // YAML
  const metadata: IndexationTable = {
    archiveItems: parsed.archiveItems,
    author: parsed.author,
    date: new Date(),
    id: slugId,
    location: parsed.location,
    size: parsed.records.length,
    sources: parsed.sources,
    tableFilename: csvFilename,
    tableLocale: parsed.tableLocale,
    title: parsed.title,
    yearsRange: parsed.yearsRange,
  };

  const yamlContent = yaml.stringify(metadata);

  // Повертаємо дані, щоб тест міг перевірити контент, не читаючи диск (опціонально)
  // Але головне - це запис файлів
  await mkdir(tablesDirectory, { recursive: true });
  await mkdir(metadataDirectory, { recursive: true });

  await writeFile(path.join(tablesDirectory, csvFilename), csvContent);
  await writeFile(path.join(metadataDirectory, yamlFilename), yamlContent);

  return { slugId, title: parsed.title, csvFilename, yamlFilename };
}
