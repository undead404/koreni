import type { TableData } from '@/app/helpers/parse-csv-file';
import { ImportPayload } from '@/shared/schemas/import';

import type { ContributeFormValues } from './types';

export default function convertContributeFormData(
  data: ContributeFormValues,
  table: TableData,
): ImportPayload {
  if (!data.tableLocale) {
    throw new Error('Table locale is required');
  }
  return {
    authorGithubUsername: data.authorGithubUsername,
    authorName: data.authorName,
    authorEmail: data.authorEmail,
    id: data.id,
    title: data.title,
    tableLocale: data.tableLocale,
    archiveItems: data.archiveItems.map(({ item }) => item),
    location: data.location.split(',').map(Number) as [number, number],
    sources: data.sources.map(({ url }) => url),
    yearsRange: data.yearsRange,
    table,
  };
}
