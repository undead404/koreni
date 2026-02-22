// Read YAML file

import { execSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';

import yaml from 'yaml';

import { indexationTableSchema } from '@/shared/schemas/indexation-table';

const REPLACEMENTS = Object.entries({
  ѣ: 'е',
  ѳ: 'ф',
  Ѳ: 'Ф',
  і: 'и',
  І: 'И',
  ѵ: 'и',
  Ѵ: 'И',
});

// 1. Find the changed YAML files in data/records, against main branch
const changedFiles = execSync('git diff --name-only main...HEAD')
  .toString()
  .split('\n');
const yamlFiles = changedFiles.filter((f) => f.endsWith('.yaml'));
if (yamlFiles.length !== 1) {
  console.error('More than one YAML file changed');
  process.exit(1);
}
const yamlFile = yamlFiles[0];

const csvFiles = changedFiles.filter((f) => f.endsWith('.csv'));
if (csvFiles.length !== 1) {
  console.error('More than one CSV file changed');
  process.exit(1);
}

const tableMetadata = yaml.parse(await readFile(yamlFile, 'utf8')) as unknown;
const table = indexationTableSchema.parse(tableMetadata);
if (table.tableLocale !== 'ru') {
  console.error('Table is not in Russian');
  process.exit(0);
}

// 2. Replace obsolete russian characters in CSV with modern ones
const csvFile = csvFiles[0];
let csvContent = await readFile(csvFile, 'utf8');
for (const [old, new_] of REPLACEMENTS) {
  csvContent = csvContent.replaceAll(old, new_);
}
// eslint-disable-next-line regexp/no-obscure-range
csvContent = csvContent.replaceAll(/ъ([^а-я])/g, '$1');
await writeFile(csvFile, csvContent);
