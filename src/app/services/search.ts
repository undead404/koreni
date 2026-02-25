import type { Client } from 'typesense';
import type {
  SearchResponse,
  SearchResponseHit,
} from 'typesense/lib/Typesense/Documents.js';

import transliterateIntoRussian from '../helpers/transliterate-into-russian';
import transliterateIntoUkrainian from '../helpers/transliterate-into-ukrainian';

export interface SearchParameters {
  client: Client;
  page?: number;
  perPage?: number;
  query: string;
}

export type SearchResult = SearchResponseHit<Record<string, unknown>>;
export type SearchResults = [SearchResult[], number];

// Returns the raw promise; does not manually fake settled states
function searchInCollection(
  client: Client,
  collection: string,
  query: string,
  page: number = 1,
  perPage: number = 24,
): Promise<SearchResponse<Record<string, unknown>>> {
  return client.collections(collection).documents().search({
    q: query,
    page: page,
    per_page: perPage,
    query_by: 'values',
    sort_by: '_text_match:desc,year:desc',
  }) as Promise<SearchResponse<Record<string, unknown>>>;
}

export default async function search({
  client,
  query,
  page = 1,
  perPage = 24,
}: SearchParameters): Promise<SearchResults> {
  const normalizedQuery = query.toLowerCase();

  // 1. Initialize promises concurrently without awaiting them inline
  const searchPromises = [
    searchInCollection(
      client,
      'unstructured_ru',
      transliterateIntoRussian(normalizedQuery),
      page,
      perPage,
    ),
    searchInCollection(
      client,
      'unstructured_uk',
      transliterateIntoUkrainian(normalizedQuery),
    ),
  ];

  // 2. Await all promises simultaneously natively
  const results = await Promise.allSettled(searchPromises);

  // 3. Centralized error handling
  const errors = results.filter((r) => r.status === 'rejected');
  if (errors.length > 0) {
    throw new AggregateError(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      errors.map((error) => error.reason),
      'Search failed in one or more languages',
    );
  }

  // 4. Data Extraction
  const fulfilledResults = results.map(
    (r) =>
      (r as PromiseFulfilledResult<SearchResponse<Record<string, unknown>>>)
        .value,
  );

  const totalFound = fulfilledResults.reduce(
    (sum, result) => sum + result.found,
    0,
  );
  const totalHits = fulfilledResults.flatMap((result) => result.hits || []);

  // 5. Native numeric sorting across the merged datasets
  totalHits.sort((a, b) => {
    // Cast Typesense text_match explicitly to numbers to prevent lexicographical bugs
    const matchA = Number(a.text_match || 0);
    const matchB = Number(b.text_match || 0);

    if (matchB !== matchA) {
      return matchB - matchA; // Descending order
    }

    // Fallback sort by year descending
    const yearA = (a.document.year as number) || 0;
    const yearB = (b.document.year as number) || 0;
    return yearB - yearA;
  });

  return [totalHits, totalFound];
}
