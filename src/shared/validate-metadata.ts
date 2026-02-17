import type { IndexationTable } from './schemas/indexation-table';

function areDistinctBy(
  tablesMetadata: IndexationTable[],
  selector: (tableMetadata: IndexationTable) => unknown,
) {
  const knownValues = new Set<unknown>();
  for (const tableMetadata of tablesMetadata) {
    const value = selector(tableMetadata);
    if (Array.isArray(value)) {
      for (const subValue of value) {
        if (knownValues.has(subValue)) {
          throw new Error('Appears more than once: ' + subValue);
        }
        knownValues.add(subValue);
      }
    } else {
      if (typeof value === 'object') {
        throw new TypeError('Should not be an object');
      }
      if (knownValues.has(value)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        throw new Error('Appears more than once: ' + (value as any));
      }
      knownValues.add(value);
    }
  }
}

export default function validateMetadata(tablesMetadata: IndexationTable[]) {
  areDistinctBy(tablesMetadata, (tableMetadata) => tableMetadata.id);
  areDistinctBy(tablesMetadata, (tableMetadata) => tableMetadata.tableFilename);
  areDistinctBy(tablesMetadata, (tableMetadata) => tableMetadata.title);
}
