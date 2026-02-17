import type { Dataset, Graph, ListItem } from 'schema-dts';

import type { IndexationTable } from '@/shared/schemas/indexation-table';

import environment from '../environment';
import generateTableDescription from '../helpers/generate-table-description';
import parsePerson from '../helpers/parse-person';

export function generateJsonLd(tablesMetadata: IndexationTable[]) {
  const site = environment.NEXT_PUBLIC_SITE.replace(/\/$/, '');

  // Для кожної таблиці сформуємо Dataset і/або ListItem
  const items = (tablesMetadata || []).map<ListItem>((t) => {
    const tDate = t?.date ? new Date(t.date) : null;
    const description = generateTableDescription(t);
    const dataset = {
      '@type': 'Dataset',
      creator: t.author ? (parsePerson(t.author) ?? undefined) : undefined,
      description,
      identifier: t.id,
      license: `${site}/license/`,
      name: t.title || t.id,
      url: `${site}/${t.id}/1/`,
      numberOfItems: Number(t.size || 0),
      ...(tDate && !Number.isNaN(tDate.getTime())
        ? { datePublished: tDate.toISOString() }
        : {}),
    } as Dataset;
    const item: ListItem = {
      '@type': 'ListItem',
      item: dataset,
      position: tablesMetadata.indexOf(t) + 1,
      url: `${site}/${t.id}/1/`,
    };
    return item;
  });

  const json: Graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${site}/tables/#page`,
        url: `${site}/tables/`,
        name: 'Корені – Список таблиць',
        description: 'Сторінка зі списком усіх таблиць проекту Корені',
        inLanguage: 'uk-UA',
        isPartOf: { '@id': `${site}/#website` },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        mainEntity: {
          '@type': 'ItemList',
          name: 'Таблиці — Корені',
          description: 'Перелік таблиць з метаданими',
          numberOfItems: tablesMetadata.length,
          itemListElement: items,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        license: `${site}/license/`,
      },
    ],
  };

  return json;
}

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
