import { z } from 'zod';

import type { ColumnConfig } from './column-config';

export function buildRowArraySchema(columns: ColumnConfig[]) {
  const columnFields = Object.fromEntries(
    columns.map((column) => [column.id, z.string()]),
  );
  const rowSchema = z.object({ id: z.uuid(), ...columnFields });
  return z.array(rowSchema);
}
