import _ from 'lodash';
import type { Client } from 'typesense';
import type {
  SearchResponse,
  SearchResponseHit,
} from 'typesense/lib/Typesense/Documents.js';

import transliterateIntoPolish from '../helpers/transliterate-into-polish';
import transliterateIntoRussian from '../helpers/transliterate-into-russian';
import transliterateIntoUkrainian from '../helpers/transliterate-into-ukrainian';

export interface SearchParameters {
  client: Client;
  facets?: Record<string, string[]>;
  query: string;
  ranges?: Record<string, [number, number]>;
}

export type SearchResult = SearchResponseHit<Record<string, unknown>>;
export type SearchResults = [SearchResult[], number, string | null];

async function searchInCollection(
  client: Client,
  collection: string,
  query: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<PromiseSettledResult<SearchResponse<any>>> {
  try {
    const result = await client.collections(collection).documents().search({
      q: query,
      query_by: 'data.*',
      sort_by: '_text_match:desc,year:desc',
    });
    return {
      value: result,
      status: 'fulfilled' as const,
    };
  } catch (error) {
    return {
      reason: error,
      status: 'rejected',
    };
  }
}

export default async function search({
  client,
  // facets,
  query,
  // ranges,
}: SearchParameters): Promise<SearchResults> {
  // const facetFilters = Object.entries(facets)
  //   .filter(([, values]) => values.length > 0)
  //   .map(([attribute, values]) =>
  //     values.map((value) => `${attribute}:${value}`).join(" || ")
  //   )
  //   .join(" && ");

  // const rangeFilters = Object.entries(ranges)
  //   .map(
  //     ([attribute, [min, max]]) =>
  //       `${attribute}:>=${min} && ${attribute}:<=${max}`
  //   )
  //   .join(" && ");

  // const filter_by = [facetFilters, rangeFilters].filter(Boolean).join(" && ");

  const resultPartitions = [
    await searchInCollection(
      client,
      'unstructured_pl',
      transliterateIntoPolish(query.toLowerCase()),
    ),
    await searchInCollection(
      client,
      'unstructured_ru',
      transliterateIntoRussian(query.toLowerCase()),
    ),
    await searchInCollection(
      client,
      'unstructured_uk',
      transliterateIntoUkrainian(query.toLowerCase()),
    ),
  ];
  let error: string | null = null;

  if (resultPartitions.some((result) => result.status === 'rejected')) {
    error = new AggregateError(
      resultPartitions
        .filter((result) => result.status === 'rejected')
        .map((result) => result.reason as unknown as Error),
      'Search failed in one or more languages',
    ).toString();
  }

  const totalFound = _.sumBy(resultPartitions, (result) =>
    result.status === 'fulfilled' ? result.value.found : 0,
  );
  const totalHits = resultPartitions.flatMap((result) =>
    result.status === 'fulfilled' ? result.value.hits : [],
  );

  return [
    _.orderBy(
      totalHits,
      ['text_match_info.best_field_score', 'document.year'],
      ['desc', 'desc'],
    ),
    totalFound,
    error,
  ] as SearchResults;
}
