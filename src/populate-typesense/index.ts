import getTableData from '../shared/get-table-data.js';
import getTablesMetadata from '../shared/get-tables-metadata.js';

import deleteFromTypesense from './delete-from-typesense.js';
import environment from './environment.js';
import getTableIdFromFile from './get-table-id-from-file.js';
import getTablesByFiles from './get-tables-by-files.js';
import populateTypesense from './populate-unstructured.js';

async function main() {
  try {
    const isFullSync = environment.FULL_SYNC;

    let filesToUpsert: string[] = [];
    let filesToDelete: string[] = [];

    // Parse delta files if not a full sync
    if (!isFullSync) {
      filesToUpsert = environment.ADDED_MODIFIED_FILES;
      filesToDelete = [
        // Need to remove added or modified files as well,
        // because those can be renamed
        ...environment.ADDED_MODIFIED_FILES,
        ...environment.DELETED_FILES,
      ];

      if (filesToUpsert.length === 0 && filesToDelete.length === 0) {
        console.log('No changes detected. Exiting.');
        process.exit(0);
      }
    }

    const tableIdsToDelete: string[] = [];
    for (const fileToDelete of filesToDelete) {
      const tableIdToDelete = getTableIdFromFile(fileToDelete);
      if (tableIdToDelete) {
        tableIdsToDelete.push(tableIdToDelete);
      }
    }
    // 1. Process Deletions First
    if (tableIdsToDelete.length > 0) {
      console.log(`Processing ${tableIdsToDelete.length} table deletions...`);
      for (const tableIdToDelete of tableIdsToDelete) {
        await deleteFromTypesense(tableIdToDelete);
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
