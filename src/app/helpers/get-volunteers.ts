import getTablesMetadata from '@/shared/get-tables-metadata';

import slugifyUkrainian from './slugify-ukrainian';

export default async function getVolunteers() {
  const tables = await getTablesMetadata();
  const tablesByVolunteer: Record<string, typeof tables> = {};
  const emailsByAuthor: Record<string, Set<string>> = {};

  for (const table of tables) {
    const authorName = table.authorName || 'undefined';
    if (!tablesByVolunteer[authorName]) {
      tablesByVolunteer[authorName] = [];
    }
    tablesByVolunteer[authorName].push(table);
    const authorEmail = table.authorEmail;
    if (authorEmail) {
      if (emailsByAuthor[authorName]) {
        emailsByAuthor[authorName].add(authorEmail);
      } else {
        emailsByAuthor[authorName] = new Set([authorEmail]);
      }
    }
  }

  const knownSlugs = new Set();
  return Object.entries(tablesByVolunteer)
    .map(([author, tables]) => {
      const name = author ?? 'Невідомі';
      let slug = slugifyUkrainian(name);
      let index = 2;
      while (knownSlugs.has(slug)) {
        slug = `${slug}-${index}`;
        index++;
      }
      knownSlugs.add(slug);
      return {
        emails: [...(emailsByAuthor[author] ?? [])].join(', '),
        name: name,
        power: tables.reduce(
          (accumulator, table) => accumulator + table.size,
          0,
        ),
        slug,
        tables,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
