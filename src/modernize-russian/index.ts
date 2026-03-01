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
const changedFiles = execSync('git diff --name-only origin/main...HEAD')
  .toString()
  .split('\n')
  // Trim double quotes
  .map((f) => f.replace(/^"(.*)"$/, '$1'))
  .filter(Boolean);
const yamlFiles = changedFiles.filter((f) => f.endsWith('.yaml'));
if (yamlFiles.length === 0) {
  console.log(changedFiles);
  console.error('No YAML file changed');
  process.exit(1);
}
if (yamlFiles.length !== 1) {
  console.log(yamlFiles);
  console.error('More than one YAML file changed');
  process.exit(1);
}
const yamlFile = yamlFiles[0];

const csvFiles = changedFiles.filter((f) => f.endsWith('.csv'));
if (csvFiles.length === 0) {
  console.log(changedFiles);
  console.error('No CSV file changed');
  process.exit(1);
}
if (csvFiles.length !== 1) {
  console.log(csvFiles);
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
const csvContent = await readFile(csvFile, 'utf8');
// Don't change the first line
const firstLineEnd = csvContent.indexOf('\n');
const firstLine = csvContent.slice(0, firstLineEnd);
let csvContentWithoutFirstLine = csvContent.slice(firstLineEnd + 1);
for (const [old, new_] of REPLACEMENTS) {
  csvContentWithoutFirstLine = csvContentWithoutFirstLine.replaceAll(old, new_);
}
csvContentWithoutFirstLine = csvContentWithoutFirstLine.replaceAll(
  // eslint-disable-next-line regexp/no-obscure-range
  /ъ([^а-я])/g,
  '$1',
);
await writeFile(csvFile, `${firstLine}\n${csvContentWithoutFirstLine}`);
