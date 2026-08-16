import getTablesMetadata from './get-tables-metadata';
import parseArchiveReference, {
  type ArchiveReference,
} from './parse-archive-reference';

export type ArchiveSourceTable = {
  id: string;
  title: string;
};

export type ArchiveSource = ArchiveReference & {
  key: string;
  tables: ArchiveSourceTable[];
  yearsRange: [number] | [number, number];
};

function compareNumericThenString(a: string, b: string): number {
  const an = Number.parseInt(a, 10);
  const bn = Number.parseInt(b, 10);
  if (Number.isFinite(an) && Number.isFinite(bn) && an !== bn) return an - bn;
  return a.localeCompare(b, 'uk');
}

function compareSources(a: ArchiveSource, b: ArchiveSource): number {
  if (a.archive !== b.archive) {
    if (!a.archive) return 1;
    if (!b.archive) return -1;
    return a.archive.localeCompare(b.archive, 'uk');
  }
  const byFond = compareNumericThenString(a.fond, b.fond);
  if (byFond !== 0) return byFond;
  const byOpys = compareNumericThenString(a.opys, b.opys);
  if (byOpys !== 0) return byOpys;
  return compareNumericThenString(a.sprava, b.sprava);
}

function mergeYearsRange(
  current: ArchiveSource['yearsRange'],
  next: readonly number[],
): ArchiveSource['yearsRange'] {
  const min = Math.min(current[0], ...next);
  const max = Math.max(current.at(-1) ?? current[0], ...next);
  return min === max ? [min] : [min, max];
}

export default async function getArchiveSources(): Promise<ArchiveSource[]> {
  const tables = await getTablesMetadata();
  const map = new Map<string, ArchiveSource>();

  for (const table of tables) {
    for (const rawItem of table.archiveItems) {
      const parsed = parseArchiveReference(rawItem);
      const key = parsed.archive
        ? `${parsed.archive}|${parsed.fond}|${parsed.opys}|${parsed.sprava}`
        : parsed.raw;
      const existing = map.get(key);
      if (existing) {
        if (!existing.tables.some((t) => t.id === table.id)) {
          existing.tables.push({ id: table.id, title: table.title });
        }
        existing.yearsRange = mergeYearsRange(
          existing.yearsRange,
          table.yearsRange,
        );
      } else {
        map.set(key, {
          ...parsed,
          key,
          tables: [{ id: table.id, title: table.title }],
          yearsRange:
            table.yearsRange.length === 1
              ? [table.yearsRange[0]]
              : [table.yearsRange[0], table.yearsRange[1]],
        });
      }
    }
  }

  return [...map.values()].sort(compareSources);
}
