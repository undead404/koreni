import type { MetadataRoute } from 'next';

import getTablesMetadata from '@/shared/get-tables-metadata';

import { PER_PAGE } from './constants';
import environment from './environment';

export const dynamic = 'force-static';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tablesMetadata = await getTablesMetadata();
  return [
    {
      changeFrequency: 'yearly',
      lastModified: new Date(),
      url: new URL(environment.NEXT_PUBLIC_SITE).toString(),
    },
    {
      changeFrequency: 'weekly',
      lastModified: new Date(),
      url: new URL('/map/', environment.NEXT_PUBLIC_SITE).toString(),
    },
    {
      changeFrequency: 'daily',
      lastModified: new Date(),
      url: new URL('/tables/', environment.NEXT_PUBLIC_SITE).toString(),
    },
    {
      changeFrequency: 'monthly',
      lastModified: new Date(),
      url: new URL('/about/', environment.NEXT_PUBLIC_SITE).toString(),
    },
    {
      changeFrequency: 'yearly',
      lastModified: new Date(),
      url: new URL('/license/', environment.NEXT_PUBLIC_SITE).toString(),
    },
    ...tablesMetadata.flatMap((tableMetadata) => {
      const numberOfPages = Math.ceil(tableMetadata.size / PER_PAGE);
      return Array.from({ length: numberOfPages }, (item, index) => {
        const url = new URL(
          `/${tableMetadata.id}/${index + 1}/`,
          environment.NEXT_PUBLIC_SITE,
        );
        return {
          changeFrequency: 'monthly' as const,
          lastModified: tableMetadata.date,
          url: url.toString(),
        };
      });
    }),
  ];
}
