import { execSync } from 'node:child_process';
import { readFile, stat, writeFile } from 'node:fs/promises';

import yaml from 'yaml';

import readCsv from '@/shared/read-csv-data';
import { indexationTableSchema } from '@/shared/schemas/indexation-table';

// 1. Find the changed YAML files in data/records, against main branch
const changedFiles = execSync('git diff --name-only main...HEAD')
  .toString()
  .split('\n')
  .filter((f) => f.startsWith('data/records/') && f.endsWith('.yaml'));

for (const yamlPath of changedFiles) {
  if (!(await stat(yamlPath))) continue;

  const documentData = yaml.parse(await readFile(yamlPath, 'utf8')) as unknown;
  const document = indexationTableSchema.parse(documentData);

  if (await stat(document.tableFilePath).catch(() => null)) {
    const records = await readCsv(document.tableFilePath);

    // Update size (excluding header)
    document.size = records.length;

    await writeFile(yamlPath, yaml.stringify(document));
    console.log(`Updated size for ${yamlPath} to ${document.size}`);
  }
}
