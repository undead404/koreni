import type { Graph, ListItem } from 'schema-dts';

import type { IndexationTable } from '@/shared/schemas/indexation-table';

import environment from '../environment';
import parsePerson from '../helpers/parse-person';

export default function JsonLdTables({
  tablesMetadata,
}: {
  tablesMetadata: IndexationTable[];
}) {
  const site = environment.NEXT_PUBLIC_SITE.replace(/\/$/, '');

  // Для кожної таблиці сформуємо Dataset і/або ListItem
  const items = (tablesMetadata || []).map<ListItem>((t) => {
    const tDate = t?.date ? new Date(t.date) : null;
    return {
      '@type': 'ListItem',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      item: {
        '@type': 'Dataset',
        creator: t.author ? (parsePerson(t.author) ?? undefined) : undefined,
        description: `${t.size} записів, ${t.yearsRange.length === 1 ? 'рік ' : ''}${t.yearsRange.join('–')}${t.yearsRange.length === 2 ? ' роки' : ''}`,
        identifier: t.id,
        license: `${site}/license/`,
        name: t.title || t.id,
        url: `${site}/${t.id}/1/`,
        numberOfItems: Number(t.size || 0),
        ...(tDate && !Number.isNaN(tDate.getTime())
          ? { datePublished: tDate.toISOString() }
          : {}),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      position: tablesMetadata.indexOf(t) + 1,
      url: `${site}/${t.id}/1/`,
    } satisfies ListItem;
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

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
