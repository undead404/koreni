import getTablesMetadata from '@/shared/get-tables-metadata';
import type { IndexationTable } from '@/shared/schemas/indexation-table';

export default async function getTablesByFiles(
  files: string[],
): Promise<IndexationTable[]> {
  const tablesMetadata = await getTablesMetadata();
  return tablesMetadata.filter((table) =>
    files.some(
      (file) =>
        file === table.tableFilePath ||
        file === `data/records/${table.id}.yaml`,
    ),
  );
}
