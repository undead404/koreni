import _ from 'lodash';
import type { Client } from 'typesense';
import type { SearchResponseHit } from 'typesense/lib/Typesense/Documents.js';

export interface SearchParameters {
  client: Client;
  facets?: Record<string, string[]>;
  query: string;
  ranges?: Record<string, [number, number]>;
}

export type SearchResult = SearchResponseHit<Record<string, unknown>>;
export type SearchResults = [SearchResult[], number];

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

  const [resultRu, resultUk] = await Promise.allSettled([
    client.collections('unstructured_ru').documents().search({
      q: query,
      query_by: 'data.*',
      // facet_by: Object.keys(facets).join(","),
      // filter_by: filter_by,
      sort_by: '_text_match:desc,year:desc',
    }),
    client.collections('unstructured_uk').documents().search({
      q: query,
      query_by: 'data.*',
      // facet_by: Object.keys(facets).join(","),
      // filter_by: filter_by,
      sort_by: '_text_match:desc,year:desc',
    }),
  ]);

  if (resultRu.status === 'rejected') {
    const error =
      resultUk.status === 'rejected'
        ? new AggregateError(
            [resultRu.reason, resultUk.reason],
            'Search failed in both languages',
          )
        : (resultRu.reason as Error);
    throw error;
  } else if (resultUk.status === 'rejected') {
    throw resultUk.reason;
  }
  let resultsRu: SearchResult[] = [];
  let resultsUk: SearchResult[] = [];
  let foundRu = 0;
  let foundUk = 0;
  if (resultRu.status === 'fulfilled') {
    resultsRu = (resultRu.value.hits as SearchResult[]) || [];
    foundRu = resultRu.value.found;
  }
  if (resultUk.status === 'fulfilled') {
    resultsUk = (resultUk.value.hits as SearchResult[]) || [];
    foundUk = resultUk.value.found;
  }

  return [
    _.orderBy(
      [...resultsRu, ...resultsUk],
      ['text_match_info.best_field_score', 'document.year'],
      ['desc', 'desc'],
    ),
    foundRu + foundUk,
  ] as SearchResults;
}
