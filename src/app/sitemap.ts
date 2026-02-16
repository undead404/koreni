import _ from 'lodash';
import type { MetadataRoute } from 'next';

import getTablesMetadata from '@/shared/get-tables-metadata';

import removeEmails from './helpers/remove-emails';
import slugifyUkrainian from './helpers/slugify-ukrainian';
import { PER_PAGE } from './constants';
import environment from './environment';

export const dynamic = 'force-static';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tablesMetadata = await getTablesMetadata();
  const knownSlugs = new Set();
  const volunteers = _.map(
    _.groupBy(tablesMetadata, 'author'),
    (tables, author) => {
      const name = author === 'undefined' ? 'Невідомі' : removeEmails(author);
      let slug = slugifyUkrainian(name);
      let index = 2;
      while (knownSlugs.has(slug)) {
        slug = `${slug}-${index}`;
        index++;
      }
      knownSlugs.add(slug);

      let lastModified = new Date('1970-01-01');
      for (const tableMetadata of tables) {
        if (lastModified < tableMetadata.date) {
          lastModified = tableMetadata.date;
        }
      }
      return {
        lastModified,
        power: tables.reduce(
          (accumulator, table) => accumulator + table.size,
          0,
        ),
        url: new URL(
          `/volunteers/${slug}/`,
          environment.NEXT_PUBLIC_SITE,
        ).toString(),
      };
    },
  ).sort((a, b) => b.power - a.power);
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
    ...volunteers.map((volunteer) => ({
      changeFrequency: 'monthly' as const,
      lastModified: volunteer.lastModified,
      url: volunteer.url,
    })),
  ];
}
