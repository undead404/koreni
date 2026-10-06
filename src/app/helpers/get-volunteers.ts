import { readFile } from 'node:fs/promises';
import path from 'node:path';

import getTablesMetadata from '@koreni/shared/get-tables-metadata';
import { emailVisibilityPolicyManifestSchema } from '@/app/account/schemata';

import slugifyUkrainian from './slugify-ukrainian';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function getSuppressedEmails(): Promise<Set<string> | null> {
  try {
    const contents = await readFile(
      path.join(process.cwd(), '.email-visibility-policy.json'),
      'utf8',
    );
    const manifest = emailVisibilityPolicyManifestSchema.parse(
      JSON.parse(contents) as unknown,
    );
    if (manifest.mode === 'all') return null;
    return new Set(
      manifest.suppressed_emails.map((email) => normalizeEmail(email)),
    );
  } catch {
    console.error(
      'Volunteer email visibility policy unavailable; failing closed.',
    );
    return null;
  }
}

export default async function getVolunteers() {
  const tables = await getTablesMetadata();
  const suppressedEmails = await getSuppressedEmails();
  const filteredTables: typeof tables = tables.map((table) => {
    if (
      suppressedEmails === null ||
      (table.authorEmail &&
        suppressedEmails.has(normalizeEmail(table.authorEmail)))
    ) {
      const metadata = { ...table };
      delete metadata.authorEmail;
      return metadata;
    }
    return table;
  });
  const tablesByVolunteer: Record<string, typeof filteredTables> = {};
  const emailsByAuthor: Partial<Record<string, Map<string, string>>> = {};

  for (const table of filteredTables) {
    const authorName = table.authorName || 'undefined';

    if (!Object.hasOwn(tablesByVolunteer, authorName)) {
      tablesByVolunteer[authorName] = [];
    }
    tablesByVolunteer[authorName].push(table);
    const authorEmail = table.authorEmail;
    if (authorEmail) {
      const emails = emailsByAuthor[authorName] ?? new Map<string, string>();
      emails.set(normalizeEmail(authorEmail), authorEmail);
      emailsByAuthor[authorName] = emails;
    }
  }

  const knownSlugs = new Set();
  return Object.entries(tablesByVolunteer)
    .map(([author, tables]) => {
      const name = author;
      let slug = slugifyUkrainian(name);
      let index = 2;
      while (knownSlugs.has(slug)) {
        slug += `-${index}`;
        index++;
      }
      knownSlugs.add(slug);
      return {
        emails: [...(emailsByAuthor[author]?.values() ?? [])].join(', '),
        name: name,
        power: tables.reduce(
          (accumulator, table) => accumulator + table.size,
          0,
        ),
        slug,
        tables,
      };
    })
    .toSorted((a, b) => a.name.localeCompare(b.name));
}
