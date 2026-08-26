import type { IndexationTable } from '@koreni/shared/schemas/indexation-table';

import serializeJsonLd from '../helpers/serialize-json-ld';

import generateJsonLd from './generate-json-ld';

export default function JsonLdTables({
  tablesMetadata,
}: {
  tablesMetadata: IndexationTable[];
}) {
  const json = generateJsonLd(tablesMetadata);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(json) }}
    />
  );
}
