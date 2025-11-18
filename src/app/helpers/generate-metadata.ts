import type { Metadata } from 'next';
import type {
  DataDownload,
  Dataset,
  GeoCoordinates,
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
  const archiveItems = item.archiveItems?.length
    ? item.archiveItems.join(', ')
    : undefined;

  // Ukrainian-only site — description always in Ukrainian
  return `${item.title}${years ? ` — роки: ${years}` : ''}${
    archiveItems ? `; архівні справи: ${archiveItems}` : ''
  }${item.size > 0 ? `; записів: ${item.size}.` : '.'}`;
}

function extractAuthorData(author?: string): { name?: string; email?: string } {
  if (!author) return {};
  const match = author.match(
    /^\s*([^<\s][^<]+)(?: <([^<>@]+@[^.<>@][^<>@][^.<>@]*\.[^<>@]+)>)?$/,
  );
  if (match)
    return {
      name: match[1].trim(),
      email: match[2]?.trim(),
    };
  return {
    name: author.trim(),
  };
}

function normalizeTwitterHandle(raw?: string | null) {
  if (!raw) return;
  return raw.startsWith('@') ? raw : `@${raw}`;
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
  const siteUrl =
    METADATA_OPTIONS.siteUrl ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    'http://localhost:3000';
  const relativePath = `/${encodeURIComponent(item.id)}/${page}/`;
  const canonical = buildCanonical(siteUrl, relativePath);

  const description = buildDescription(item);
  const { name: authorName } = extractAuthorData(item.author);

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
      creator: normalizeTwitterHandle(METADATA_OPTIONS.twitterCreator),
    },
    robots: {
      index: true,
      follow: true,
    },
    pagination: {
      previous: previousPage
        ? buildCanonical(
            siteUrl,
            `/${encodeURIComponent(item.id)}/${previousPage}/`,
          )
        : undefined,
      next: nextPage
        ? buildCanonical(
            siteUrl,
            `/${encodeURIComponent(item.id)}/${nextPage}/`,
          )
        : undefined,
    },
  };

  return metadata;
}

/**
 * Example small helper to be used in a route's generateMetadata:
 *
 * // app/tables/[tableFilename]/route.tsx (or page.tsx)
 * import { generateIndexationMetadata } from '@/lib/metadata/indexation';
 * import { getTableByFilename } from '@/lib/data';
 *
 * export async function generateMetadata({ params }: { params: { tableFilename: string } }) {
 *   const item = await getTableByFilename(params.tableFilename);
 *   if (!item) return {};
 *   return generateIndexationMetadata(item, {
 *     siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
 *     siteName: 'Мій Архів',
 *     twitterCreator: '@myarchive',
 *   });
 * }
 *
 * // In the page/server component itself you can add the JSON-LD script:
 *
 * // app/tables/[tableFilename]/page.tsx
 * /*
 * export default async function TablePage({ params }) {
 *   const item = await getTableByFilename(params.tableFilename);
 *   const metadata = generateIndexationMetadata(item, { siteUrl: process.env.NEXT_PUBLIC_SITE_URL });
 *
 *   return (
 *     <>
 *       <script
 *         type="application/ld+json"
 *         // prefer injecting JSON-LD as a script element
 *         dangerouslySetInnerHTML={{ __html: metadata.other?.ldjson ?? '{}' }}
 *       />
 *       <main>...render table...</main>
 *     </>
 *   );
 * }
 * */
export function generateJsonLd(item: IndexationTable): string {
  const siteUrl =
    METADATA_OPTIONS.siteUrl ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    'http://localhost:3000';
  const relativePath = `/${encodeURIComponent(item.id)}/1/`;
  const canonical = buildCanonical(siteUrl, relativePath);

  const description = buildDescription(item);

  const { name: authorName, email: authorEmail } = extractAuthorData(
    item.author,
  );

  const publishedISO = (() => {
    try {
      const d = new Date(item.date);
      if (Number.isNaN(d.getTime())) return;
      return d.toISOString();
    } catch {
      return;
    }
  })();

  // Build a JSON-LD object (Dataset-like). Prefer adding as a <script> in the page component,
  // but we include it here as a JSON string in metadata.other.ldjson for convenience.
  const jsonLd: Dataset = {
    '@type': 'Dataset',
    '@id': canonical,
    name: item.title,
    description,
    inLanguage: item.tableLocale,
    creator: authorName
      ? ({
          '@type': 'Person',
          email: authorEmail,
          name: authorName,
        } satisfies Person)
      : undefined,
    datePublished: publishedISO,
    spatialCoverage:
      item.location && item.location.length === 2
        ? ({
            '@type': 'Place',
            geo: {
              '@type': 'GeoCoordinates',
              latitude: item.location[0],
              longitude: item.location[1],
            } satisfies GeoCoordinates,
          } satisfies Place)
        : undefined,
    distribution: [
      {
        '@type': 'DataDownload',
        contentUrl: `https://raw.githubusercontent.com/undead404/koreni/refs/heads/main/data/tables/${encodeURIComponent(
          item.tableFilename,
        )}`,
        encodingFormat: 'text/csv',
        name: item.tableFilename,
      } satisfies DataDownload,
    ],
    keywords:
      item.archiveItems?.map((archiveItem) => archiveItem.split('-')[0]) ??
      undefined,
  };

  // Clean undefined fields
  // eslint-disable-next-line unicorn/prefer-structured-clone
  const cleanJsonLd = JSON.parse(
    JSON.stringify({ '@context': 'https://schema.org', ...jsonLd }),
  ) as unknown;

  return process.env.NODE_ENV === 'development'
    ? JSON.stringify(cleanJsonLd, null, 2)
    : JSON.stringify(cleanJsonLd);
}
