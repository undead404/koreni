import _ from 'lodash';
import type { Client } from 'typesense';
import type { SearchResponseHit } from 'typesense/lib/Typesense/Documents.js';

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

  const resultPartitions = await Promise.allSettled([
    client
      .collections('unstructured_pl')
      .documents()
      .search({
        q: transliterateIntoPolish(query.toLowerCase()),
        query_by: 'data.*',
        // facet_by: Object.keys(facets).join(","),
        // filter_by: filter_by,
        sort_by: '_text_match:desc,year:desc',
      }),
    client
      .collections('unstructured_ru')
      .documents()
      .search({
        q: transliterateIntoRussian(query.toLowerCase()),
        query_by: 'data.*',
        // facet_by: Object.keys(facets).join(","),
        // filter_by: filter_by,
        sort_by: '_text_match:desc,year:desc',
      }),
    client
      .collections('unstructured_uk')
      .documents()
      .search({
        q: transliterateIntoUkrainian(query.toLowerCase()),
        query_by: 'data.*',
        // facet_by: Object.keys(facets).join(","),
        // filter_by: filter_by,
        sort_by: '_text_match:desc,year:desc',
      }),
  ]);

  if (resultPartitions.some((result) => result.status === 'rejected')) {
    const error = new AggregateError(
      resultPartitions
        .filter((result) => result.status === 'rejected')
        .map((result) => result.reason as unknown as Error),
      'Search failed in one or more languages',
    );
    throw error;
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
  ] as SearchResults;
}
