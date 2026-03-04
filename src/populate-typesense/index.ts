import getTableData from '../shared/get-table-data.js';
import getTablesMetadata from '../shared/get-tables-metadata.js';

import deleteFromTypesense from './delete-from-typesense.js';
import getTablesByFiles from './get-tables-by-files.js';
import populateTypesense from './populate-unstructured.js';

async function main() {
  try {
    const isFullSync = process.env.FULL_SYNC === 'true';

    let filesToUpsert: string[] = [];
    let filesToDelete: string[] = [];

    // Parse delta files if not a full sync
    if (!isFullSync) {
      const addedModified = process.env.ADDED_MODIFIED_FILES?.trim();
      const deleted = process.env.DELETED_FILES?.trim();

      filesToUpsert = addedModified ? addedModified.split(',') : [];
      filesToDelete = deleted ? deleted.split(',') : [];

      if (filesToUpsert.length === 0 && filesToDelete.length === 0) {
        console.log('No changes detected. Exiting.');
        process.exit(0);
      }
    }

    const tablesToDelete = await getTablesByFiles(filesToDelete);

    // 1. Process Deletions First
    if (tablesToDelete.length > 0) {
      console.log(`Processing ${tablesToDelete.length} table deletions...`);
      for (const tableToDelete of tablesToDelete) {
        await deleteFromTypesense(tableToDelete);
      }
    }

    // 2. Process Upserts or Full Sync
    const tablesToUpsert = await (isFullSync
      ? getTablesMetadata()
      : getTablesByFiles(filesToUpsert));

    if (tablesToUpsert.length === 0) {
      console.log('No tables to populate.');
      process.exit(0);
    }

    // Process sequentially to prevent OOM errors
    for (const tableMetadata of tablesToUpsert) {
      const tableData = await getTableData(tableMetadata);
      const table = { ...tableMetadata, data: tableData };

      await populateTypesense(table);

      // Optional but recommended: Explicitly clear large objects from memory
      table.data = [];
    }

    console.log('Synchronization complete.');
    process.exit(0);
  } catch (error) {
    console.error('Fatal synchronization error:', error);
    process.exit(1);
  }
}

void main();
