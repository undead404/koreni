import type { IndexationTable } from '@/shared/schemas/indexation-table';

export interface IndexationTableWithData extends IndexationTable {
  data: Record<string, unknown>[];
}
export interface RowForImport {
  data: IndexationTableWithData['data'][0];
  id: string;
  location: IndexationTable['location'];
  tableId: IndexationTable['id'];
  title: IndexationTable['title'];
}
