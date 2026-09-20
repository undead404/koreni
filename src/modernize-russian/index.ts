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
  ξ: 'кс',
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
  console.error(
    `Expected exactly 1 YAML file in data/records/, found 0. Changed files: ${changedFiles.join(', ')}`,
  );
  process.exit(1);
}
if (yamlFiles.length !== 1) {
  console.error(
    `Expected exactly 1 YAML file, found ${yamlFiles.length}: ${yamlFiles.join(', ')}. Each PR must contain exactly one data contribution.`,
  );
  process.exit(1);
}
const yamlFile = yamlFiles[0];

const csvFiles = changedFiles.filter((f) => f.endsWith('.csv'));
if (csvFiles.length === 0) {
  console.error(
    `Expected exactly 1 CSV file in data/csv/, found 0. Changed files: ${changedFiles.join(', ')}`,
  );
  process.exit(1);
}
if (csvFiles.length !== 1) {
  console.error(
    `Expected exactly 1 CSV file, found ${csvFiles.length}: ${csvFiles.join(', ')}.`,
  );
  process.exit(1);
}

const tableMetadata = yaml.parse(await readFile(yamlFile, 'utf8')) as unknown;
const table = indexationTableSchema.parse(tableMetadata);
if (table.tableLocale !== 'ru') {
  console.log(
    `Table '${table.id}' has locale '${table.tableLocale}', not 'ru'. Skipping orthography normalization.`,
  );
  process.exit(0);
}

// 2. Replace obsolete russian characters in CSV with modern ones
const csvFile = csvFiles[0];
const csvContent = await readFile(csvFile, 'utf8');
// Don't change the first line
const firstLineEnd = csvContent.indexOf('\n');
const firstLine = csvContent.slice(0, firstLineEnd);
let csvContentWithoutFirstLine = csvContent.slice(firstLineEnd + 1);
const originalContent = csvContentWithoutFirstLine;
for (const [old, new_] of REPLACEMENTS) {
  // eslint-disable-next-line unicorn/no-unsafe-string-replacement
  csvContentWithoutFirstLine = csvContentWithoutFirstLine.replaceAll(old, new_);
}
csvContentWithoutFirstLine = csvContentWithoutFirstLine.replaceAll(
  // eslint-disable-next-line regexp/no-obscure-range
  /ъ([^а-я])/g,
  '$1',
);
await writeFile(csvFile, `${firstLine}\n${csvContentWithoutFirstLine}`);

if (csvContentWithoutFirstLine === originalContent) {
  console.log(
    `No obsolete Russian characters found in '${csvFile}'. Normalization complete.`,
  );
} else {
  console.log(`Normalized pre-reform Russian orthography in '${csvFile}'.`);
}
