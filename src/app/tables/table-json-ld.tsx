import type { Dataset, Graph } from 'schema-dts';

import type { IndexationTable } from '@/shared/schemas/indexation-table';

import environment from '../environment';

export default function JsonLdTables({
  tablesMetadata,
}: {
  tablesMetadata: IndexationTable[];
}) {
  const site = environment.NEXT_PUBLIC_SITE.replace(/\/$/, '');

  // Для кожної таблиці сформуємо Dataset і/або ListItem
  const datasets = (tablesMetadata || []).map<Dataset>((t) => {
    const tDate = t?.date ? new Date(t.date) : null;
    return {
      '@type': 'Dataset',
      identifier: t.id,
      name: t.title || t.id,
      url: `${site}/${t.id}/1/`,
      numberOfItems: Number(t.size || 0),
      ...(tDate && !Number.isNaN(tDate.getTime())
        ? { datePublished: tDate.toISOString() }
        : {}),
    };
  });

  const json: Graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${site}/tables/`,
        url: `${site}/tables/`,
        name: 'Наявні таблиці — Корені',
        description: 'Сторінка зі списком усіх таблиць проекту Корені',
        inLanguage: 'uk-UA',
        isPartOf: { '@id': `${site}/#website` },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        mainEntity: {
          '@type': 'CollectionPage',
          name: 'Таблиці — Корені',
          about: 'Перелік таблиць з метаданими',
          numberOfItems: tablesMetadata.length,
          hasPart: datasets,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        license: `${site}/license/`,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
