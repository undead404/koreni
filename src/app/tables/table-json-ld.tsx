import type { IndexationTable } from '@/shared/schemas/indexation-table';

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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
