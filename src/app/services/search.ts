import type { Client } from 'typesense';
import type { SearchResponseHit } from 'typesense/lib/Typesense/Documents.js';
import type {
  MultiSearchRequestSchema,
  MultiSearchRequestsSchema,
} from 'typesense/lib/Typesense/MultiSearch';

import transliterateIntoPolish from '../helpers/transliterate-into-polish';
import transliterateIntoRussian from '../helpers/transliterate-into-russian';
import transliterateIntoUkrainian from '../helpers/transliterate-into-ukrainian';

export interface SearchParameters {
  client: Client;
  page?: number;
  perPage?: number;
  query: string;
  yearFrom?: string;
  yearTo?: string;
}

export type SearchResult = SearchResponseHit<Record<string, unknown>>;
export type SearchResults = [SearchResult[], number];

export default async function search({
  client,
  query,
  page = 1,
  perPage = 24,
  yearFrom,
  yearTo,
}: SearchParameters): Promise<SearchResults> {
  const normalizedQuery = query.toLowerCase();

  const searches: MultiSearchRequestsSchema['searches'] = [
    {
      collection: 'unstructured_pl',
      q: transliterateIntoPolish(normalizedQuery),
    },
    {
      collection: 'unstructured_ru',
      q: transliterateIntoRussian(normalizedQuery),
    },
    {
      collection: 'unstructured_uk',
      q: transliterateIntoUkrainian(normalizedQuery),
    },
  ];

  const commonParameters: Partial<MultiSearchRequestSchema> = {
    page,
    per_page: perPage,
    query_by: 'values',
    sort_by: '_text_match:desc,year:desc',
    num_typos: 2,
  };

  if (yearFrom && yearTo) {
    commonParameters.filter_by = `year: [${yearFrom}..${yearTo}]`;
  } else if (yearFrom) {
    commonParameters.filter_by = `year: >=${yearFrom}`;
  } else if (yearTo) {
    commonParameters.filter_by = `year: <=${yearTo}`;
  }

  const response = await client.multiSearch.perform<
    Record<string, unknown>[],
    true
  >({ searches, union: true }, commonParameters);
  const hits = response.hits || [];
  const totalFound = response.found || 0;

  return [hits as SearchResult[], totalFound];
}
