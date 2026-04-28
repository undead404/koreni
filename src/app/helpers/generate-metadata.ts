import type { Metadata } from 'next';
import type {
  DataDownload,
  GeoCoordinates,
  Graph,
  Person,
  Place,
} from 'schema-dts';

import { IndexationTable } from '@/shared/schemas/indexation-table';

import { PER_PAGE } from '../constants';
import environment from '../environment';

const METADATA_OPTIONS = {
  siteUrl: environment.NEXT_PUBLIC_SITE,
  siteName: 'Корені',
  twitterCreator: '@negativo_ua',
};

/**
 * Build a short Ukrainian description for an indexation table.
 */
function formatYears(years: number[] | undefined) {
  if (!years || years.length === 0) return;
  if (years.length === 1) return String(years[0]);
  return `${years[0]}–${years[1]}`;
}

function buildDescription(item: IndexationTable) {
  const years = formatYears(item.yearsRange);
  const recordCount = item.size > 0 ? `Індексовано ${item.size} записів.` : '';
  const location = item.title;

  return `${location}${years ? ` (${years})` : ''}. ${recordCount} Таблиця сформована на основі справ: ${item.archiveItems.join(', ')}.`;
}

/**
 * Helper: build canonical absolute URL from base + relative path.
 */
function buildCanonical(base: string, relativePath: string) {
  try {
    return new URL(relativePath, base).toString();
  } catch {
    return `${base.replace(/\/$/, '')}${relativePath.startsWith('/') ? relativePath : '/' + relativePath}`;
  }
}

/**
 * Create Next.js Metadata for an IndexationTable.
 *
 * This function returns a Metadata object suitable for use in an app-router
 * route's generateMetadata function:
 *
 * Example usage in a route segment:
 *
 * // app/tables/[tableFilename]/route-metadata.ts
 * import { generateIndexationMetadata } from '@/lib/metadata/indexation';
 * import { getTableByFilename } from '@/lib/data';
 *
 * export async function generateMetadata({ params }: { params: { tableFilename: string } }) {
 *   const item = await getTableByFilename(params.tableFilename);
 *   if (!item) return {};
 *   return generateIndexationMetadata(item, { siteUrl: process.env.NEXT_PUBLIC_SITE_URL, siteName: 'Архів', twitterCreator: '@archive' });
 * }
 *
 * Note: JSON-LD script injection is best added directly in the page (server component)
 * using a <script type="application/ld+json" dangerouslySetInnerHTML=... /> because
 * Next.js metadata API doesn't currently provide a first-class script slot for JSON-LD.
 */
export function generateIndexationMetadata(
  item: IndexationTable,
  page: number,
): Metadata {
  const previousPage = page === 1 ? undefined : page - 1;
  const nextPage = page * PER_PAGE < item.size ? page + 1 : undefined;
  const siteUrl = METADATA_OPTIONS.siteUrl;
  const relativePath = `/${encodeURIComponent(item.id)}/${page}/`;
  const canonical = relativePath;

  const description = buildDescription(item);
  const authorName = item.authorName;

  const publishedISO = (() => {
    try {
      const d = new Date(item.date);
      if (Number.isNaN(d.getTime())) return;
      return d.toISOString();
    } catch {
      return;
    }
  })();

  const metadata: Metadata = {
    alternates: {
      canonical,
      types: {
        prev: previousPage
          ? `/${encodeURIComponent(item.id)}/${previousPage}/`
          : null,
        next: nextPage ? `/${encodeURIComponent(item.id)}/${nextPage}/` : null,
      },
    },
    authors: authorName
      ? [
          {
            name: authorName,
            url: item.authorEmail ? `mailto:${item.authorEmail}` : undefined,
          },
        ]
      : undefined,
    title: item.title,
    description,
    metadataBase: new URL(siteUrl),
    openGraph: {
      title: item.title,
      description,
      url: canonical,
      siteName: METADATA_OPTIONS.siteName,
      type: 'article',
      locale:
        item.tableLocale === 'uk'
          ? 'uk-UA'
          : item.tableLocale === 'ru'
            ? 'ru-RU'
            : 'pl-PL',
      publishedTime: publishedISO,
      // authors is supported by the OG metadata shape in Next.js
      authors: authorName ? [authorName] : undefined,
    },
    twitter: {
      card: 'summary', // no image previews available for indexations
      title: item.title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };

  return metadata;
}

export function generateJsonLd(item: IndexationTable): string {
  const siteUrl = METADATA_OPTIONS.siteUrl;
  const relativePath = `/${encodeURIComponent(item.id)}/1/`;
  const canonical = buildCanonical(siteUrl, relativePath);

  const description = buildDescription(item);

  const authorName = item.authorName;
  const authorEmail = item.authorEmail ?? null;

  const publishedISO = (() => {
    try {
      const d = new Date(item.date);
      if (Number.isNaN(d.getTime())) return;
      return d.toISOString();
    } catch {
      return;
    }
  })();

  const keywords =
    item.archiveItems.length > 0
      ? [
          ...new Set(
            item.archiveItems.map((archiveItem) => archiveItem.split('-')[0]),
          ),
        ]
      : undefined;

  // Build a JSON-LD object (Dataset-like). Prefer adding as a <script> in the page component,
  // but we include it here as a JSON string in metadata.other.ldjson for convenience.
  const jsonLd: Graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@id': `${canonical}/#webpage`,
        '@type': 'WebPage',
        datePublished: publishedISO,
        description,
        inLanguage: item.tableLocale,
        isPartOf: { '@id': `${siteUrl}/#website` },
        mainEntity: { '@id': canonical },
        name: item.title,
        url: canonical,
      },
      {
        '@id': canonical,
        '@type': 'Dataset',
        creator: authorName
          ? ({
              '@type': 'Person',
              email: authorEmail || undefined,
              name: authorName,
            } satisfies Person)
          : undefined,
        datePublished: publishedISO,
        description,
        distribution: [
          {
            '@type': 'DataDownload',
            contentUrl: `https://raw.githubusercontent.com/undead404/koreni/refs/heads/main/${item.tableFilePath}`,
            encodingFormat: 'text/csv',
            name: item.tableFilePath.split('/').pop() ?? item.tableFilePath,
          } satisfies DataDownload,
        ],
        includedInDataCatalog: {
          '@type': 'DataCatalog',
          name: 'Корені – пошук у народних генеалогічних індексах',
          url: siteUrl,
        },
        identifier: item.archiveItems,
        inLanguage: item.tableLocale,
        keywords,
        license: `${siteUrl}/license/`,
        name: item.title,
        spatialCoverage: {
          '@type': 'Place',
          geo: {
            '@type': 'GeoCoordinates',
            latitude: item.location[0],
            longitude: item.location[1],
          } satisfies GeoCoordinates,
        } satisfies Place,
        variableMeasured: `${item.size} records`,
      },
    ],
  };

  return process.env.NODE_ENV === 'development'
    ? JSON.stringify(jsonLd, null, 2)
    : JSON.stringify(jsonLd);
}
