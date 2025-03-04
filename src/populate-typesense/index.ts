import getTableData from '../shared/get-table-data.js';
import getTablesMetadata from '../shared/get-tables-metadata.js';

import populateTypesense from './populate-unstructured.js';

async function main() {
  try {
    const tablesMetadata = await getTablesMetadata();
    const tables = await Promise.all(
      tablesMetadata.map(async (tableMetadata) => {
        const tableData = await getTableData(tableMetadata);
        return {
          ...tableMetadata,
          data: tableData,
        };
      }),
    );
    if (tables.length === 0) {
      console.log('No tables to populate');
      process.exit(0);
    }
    for (const table of tables) {
      await populateTypesense(table);
    }
    console.log('All tables have been populated');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

void main();
