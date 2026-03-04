import type { IndexationTable } from '@/shared/schemas/indexation-table';

import typesense from './typesense';

export default async function deleteFromTypesense(
  tableToDelete: IndexationTable,
) {
  const { id, tableLocale } = tableToDelete;
  console.log(`Deleting ${id}`);
  await typesense
    .collections(`unstructured_${tableLocale}`)
    .documents()
    .delete({
      filter_by: 'table_id:' + id,
    });
}
