import { z } from 'zod';

import type { ColumnConfig } from './column-config';
import { PARTIAL_ISO_REGEX } from './parse-partial-iso-date';

const DATE_FIELD = z.string().regex(PARTIAL_ISO_REGEX).or(z.literal(''));
const STRING_FIELD = z.string();

type ColumnZodField = typeof DATE_FIELD | typeof STRING_FIELD;

function buildColumnField(column: ColumnConfig): ColumnZodField {
  if (column.expectedType === 'date') {
    return DATE_FIELD;
  }
  return STRING_FIELD;
}

export function buildRowArraySchema(columns: ColumnConfig[]) {
  const columnFields: Record<string, ColumnZodField> = Object.fromEntries(
    columns.map((column) => [column.id, buildColumnField(column)]),
  );
  const rowSchema = z.object({ id: z.uuid(), ...columnFields });
  return z.array(rowSchema);
}
