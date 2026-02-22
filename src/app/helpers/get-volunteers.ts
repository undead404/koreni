import getTablesMetadata from '@/shared/get-tables-metadata';

import extractEmails from './extract-emails';
import slugifyUkrainian from './slugify-ukrainian';

export default async function getVolunteers() {
  const tables = await getTablesMetadata();
  const tablesByVolunteer: Record<string, typeof tables> = {};

  for (const table of tables) {
    const author = table.authorName || 'undefined';
    if (!tablesByVolunteer[author]) {
      tablesByVolunteer[author] = [];
    }
    tablesByVolunteer[author].push(table);
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
        emails: extractEmails(author),
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
