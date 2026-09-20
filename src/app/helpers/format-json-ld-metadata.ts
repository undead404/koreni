import type { ArchiveOrganization, CreativeWork } from 'schema-dts';

import type { Archive } from '@koreni/shared/schemas/archive';

export function formatTemporalCoverage(
  yearsRange: readonly number[] | undefined,
): string | undefined {
  if (
    !yearsRange ||
    (yearsRange.length !== 1 && yearsRange.length !== 2) ||
    yearsRange.some((year) => !Number.isSafeInteger(year))
  ) {
    return undefined;
  }

  return yearsRange.join('/');
}

export function createArchivalProvenance(
  archiveItem: string,
  archives?: ReadonlyMap<string, Archive>,
): CreativeWork | undefined {
  const parts = archiveItem.split('-');

  if (parts.length !== 4 || parts.some((part) => part.length === 0)) {
    return undefined;
  }

  const [archive, fonds, opus, file] = parts;

  if (!archives) {
    return {
      '@type': 'CreativeWork',
      identifier: {
        '@type': 'PropertyValue',
        propertyID: 'Archive-Fonds-Opus-File',
        value: archiveItem,
      },
      name: `${archive}, фонд ${fonds}, опис ${opus}, справа ${file}`,
    };
  }

  const archiveMetadata = archives.get(archive);

  const holdingArchive: ArchiveOrganization | undefined = archiveMetadata
    ? {
        '@type': 'ArchiveOrganization',
        name: archiveMetadata.title,
        sameAs: [
          ...(archiveMetadata.website ? [archiveMetadata.website] : []),
          `https://www.wikidata.org/wiki/${archiveMetadata.wikidataId}`,
        ],
      }
    : undefined;

  return {
    '@type': 'ArchiveComponent',
    identifier: archiveItem,
    name: `Фонд ${fonds}, опис ${opus}, справа ${file}`,
    ...(holdingArchive && { holdingArchive }),
  };
}

export function createArchivalProvenanceList(
  archiveItems: readonly string[] | undefined,
  archives?: ReadonlyMap<string, Archive>,
): CreativeWork[] | undefined {
  if (!archiveItems) return undefined;

  const provenance = archiveItems
    .map((archiveItem) => createArchivalProvenance(archiveItem, archives))
    .filter((item): item is CreativeWork => item !== undefined);

  return provenance.length > 0 ? provenance : undefined;
}
