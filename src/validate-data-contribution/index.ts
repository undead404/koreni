import { execSync } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

import { parse } from 'yaml';

import getTablesMetadata from '@/shared/get-tables-metadata';
import { indexationTableSchema } from '@/shared/schemas/indexation-table';

/**
 * Extracts the contributed YAML and CSV files from the git diff.
 * Asserts exactly one of each.
 */
export function extractContributionFiles(changedFiles: string[]): {
  yamlPath: string;
  csvPath: string;
} {
  const yamlFiles = changedFiles.filter(
    (f) => f.startsWith('data/records/') && f.endsWith('.yaml'),
  );
  const csvFiles = changedFiles.filter(
    (f) => f.startsWith('data/csv/') && f.endsWith('.csv'),
  );

  if (yamlFiles.length === 0) {
    console.error(
      `Expected exactly 1 YAML file in data/records/, found 0. Changed files: ${changedFiles.join(', ')}`,
    );
    process.exit(1);
  }

  if (yamlFiles.length > 1) {
    console.error(
      `Expected exactly 1 YAML file, found ${yamlFiles.length}: ${yamlFiles.join(', ')}. Each PR must contain exactly one data contribution.`,
    );
    process.exit(1);
  }

  if (csvFiles.length === 0) {
    console.error(
      `Expected exactly 1 CSV file in data/csv/, found 0. Changed files: ${changedFiles.join(', ')}`,
    );
    process.exit(1);
  }

  if (csvFiles.length > 1) {
    console.error(
      `Expected exactly 1 CSV file, found ${csvFiles.length}: ${csvFiles.join(', ')}.`,
    );
    process.exit(1);
  }

  return {
    yamlPath: yamlFiles[0],
    csvPath: csvFiles[0],
  };
}

/**
 * Validates that the YAML filename matches the id field (case-insensitive).
 */
export function validateFilenameIdConsistency(
  yamlPath: string,
  parsedId: string,
): void {
  const bareFileName = path.basename(yamlPath);
  const expectedFileName = `${parsedId.toLowerCase()}.yaml`;

  if (bareFileName.toLowerCase() !== expectedFileName) {
    console.error(
      `Filename mismatch: file is '${bareFileName}' but YAML id field is '${parsedId}'. Rename the file to '${parsedId}.yaml' or update the id field.`,
    );
    process.exit(1);
  }
}

/**
 * Validates that the YAML's tableFilePath matches the contributed CSV path (case-sensitive).
 */
export function validateTableFilePathConsistency(
  declaredPath: string,
  contributedCsvPath: string,
): void {
  if (declaredPath !== contributedCsvPath) {
    console.error(
      `tableFilePath mismatch: YAML declares tableFilePath='${declaredPath}' but the contributed CSV is '${contributedCsvPath}'. These must match.`,
    );
    process.exit(1);
  }
}

/**
 * Validates that the CSV file exists at the declared path.
 */
export async function validateCsvFileExists(csvPath: string): Promise<void> {
  try {
    await access(csvPath);
  } catch {
    console.error(
      `CSV file not found at declared tableFilePath='${csvPath}'. Ensure the CSV is committed at exactly that path.`,
    );
    process.exit(1);
  }
}

/**
 * Main validation orchestrator.
 */
async function main(): Promise<void> {
  try {
    // Step 1: Identify contributed files
    const changedFilesOutput = execSync(
      'git diff --name-only origin/main...HEAD',
    )
      .toString()
      .split('\n')
      .map((f) => f.replace(/^"(.*)"$/, '$1'))
      .filter(Boolean);

    if (changedFilesOutput.length === 0) {
      console.error(
        'Could not determine changed files. Ensure fetch-depth: 0 is set in the checkout step.',
      );
      process.exit(1);
    }

    const { yamlPath, csvPath } = extractContributionFiles(changedFilesOutput);

    // Step 2: Parse and schema-validate the contributed YAML
    const fileContent = await readFile(yamlPath, 'utf8');
    const fileData = parse(fileContent) as unknown;
    let tableMetadata;
    try {
      tableMetadata = indexationTableSchema.parse(fileData);
    } catch (error) {
      console.error(
        `YAML schema validation failed for ${yamlPath}:\n${error instanceof Error ? error.message : String(error)}`,
      );
      process.exit(1);
    }

    // Step 3: Filename ↔ id consistency
    validateFilenameIdConsistency(yamlPath, tableMetadata.id);

    // Step 4: tableFilePath ↔ contributed CSV consistency
    validateTableFilePathConsistency(tableMetadata.tableFilePath, csvPath);

    // Step 5: CSV file existence on disk
    await validateCsvFileExists(csvPath);

    // Step 6: Global uniqueness (id, tableFilePath, title)
    try {
      await getTablesMetadata();
    } catch (error) {
      console.error(
        `Global metadata validation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      process.exit(1);
    }

    // Success
    console.log(
      `✓ Data contribution validated: id='${tableMetadata.id}', tableFilePath='${tableMetadata.tableFilePath}'`,
    );
    process.exit(0);
  } catch (error) {
    console.error(
      `Unexpected error during validation: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}

// Only run main if not in test environment
if (process.env.NODE_ENV !== 'test') {
  void main();
}
