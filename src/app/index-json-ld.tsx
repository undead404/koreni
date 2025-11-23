import type { Graph } from 'schema-dts';

import type { IndexationTable } from '@/shared/schemas/indexation-table';

import environment from './environment';

export default function JsonLdHome({
  tablesMetadata,
}: {
  tablesMetadata: IndexationTable[];
}) {
  const site = environment.NEXT_PUBLIC_SITE.replace(/\/$/, '');

  // знаходимо найпізнішу дату серед таблиць (для datePublished сторінки)
  const dates = (tablesMetadata || [])
    .map((t) => t.date)
    .filter((d): d is Date => !!d && !Number.isNaN(d.getTime()));

  const latestDate =
    dates.length > 0
      ? new Date(Math.max(...dates.map((d) => d.getTime())))
      : null;

  const json: Graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${site}/#website`,
        url: `${site}/`,
        name: 'Корені',
        description: 'Пошук у народних генеалогічних індексах',
        publisher: {
          '@type': 'Organization',
          name: 'Корені',
          url: `${site}/`,
        },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        potentialAction: {
          '@type': 'SearchAction',
          target: `${site}/?query={search_term_string}`,
          'query-input': 'required name=search_term_string',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        license: `${site}/license/`,
      },
      {
        '@type': 'WebPage',
        '@id': `${site}/#homepage`,
        url: `${site}/`,
        name: 'Корені — пошук',
        description: 'Корені – пошук у народних генеалогічних індексах',
        inLanguage: 'uk-UA',
        isPartOf: { '@id': `${site}/#website` },
        primaryImageOfPage: {
          '@type': 'ImageObject',
          height: {
            '@type': 'QuantitativeValue',
            value: 512,
          },
          url: `${site}/icon.png`,
          width: {
            '@type': 'QuantitativeValue',
            value: 512,
          },
        },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        mainEntity: {
          '@type': 'CollectionPage',
          description: `Сторінка зі списком усіх ${tablesMetadata.length} таблиць проекту Корені`,
          name: 'Корені – Список таблиць',
          numberOfItems: Number(tablesMetadata.length || 0),
          url: `${site}/tables/`,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        ...(latestDate ? { datePublished: latestDate.toISOString() } : {}),
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
