import type { CreativeWork } from 'schema-dts';

export function formatTemporalCoverage(
  yearsRange: readonly number[] | undefined,
): string | undefined {
  if (
    !yearsRange ||
    (yearsRange.length !== 1 && yearsRange.length !== 2) ||
    yearsRange.some((year) => !Number.isInteger(year))
  ) {
    return undefined;
  }

  return yearsRange.join('/');
}

export function createArchivalProvenance(
  archiveItem: string,
): CreativeWork | undefined {
  const parts = archiveItem.split('-');

  if (parts.length !== 4 || parts.some((part) => part.length === 0)) {
    return undefined;
  }

  const [archive, fonds, opus, file] = parts;

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

export function createArchivalProvenanceList(
  archiveItems: readonly string[] | undefined,
): CreativeWork[] | undefined {
  const provenance = archiveItems
    ?.map(createArchivalProvenance)
    .filter((item): item is CreativeWork => item !== undefined);

  return provenance && provenance.length > 0 ? provenance : undefined;
}
