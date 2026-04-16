# Refactor Search to use Typesense Multi-Search with Union

## Objective

Replace the manual client-side mapping, fetching, and sorting of the three language collections with a single Typesense `multi_search` request using `union: true`. This delegates pagination and global ranking to the Typesense engine.

## File Modifications

### `src/app/services/search.ts`

- **Delete** the `searchInCollection` helper function entirely.
- **Delete** the client-side `Promise.allSettled` execution, array flattening, and manual numeric sorting (`totalHits.sort(...)`) blocks inside the `search` function.
- **Construct Searches Array:** Inside the `search` function, construct an array mapping the transliterated queries to their respective collections:

  ```typescript
  const searches = [
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
  ```

- **Configure Global Parameters:** Construct a `commonParams` object to hold the global pagination, query rules, and the union directive:

  ```typescript
  const commonParams: Record<string, unknown> = {
    page,
    per_page: perPage,
    query_by: 'values',
    sort_by: '_text_match:desc,year:desc',
    union: true,
  };
  ```

- **Integrate Year Filtering:** Apply the year range filtering directly to `commonParams`.
  - If both `yearFrom` and `yearTo` exist: `commonParams.filter_by = \`year: [${yearFrom}..${yearTo}]\``
  - If only `yearFrom` exists: `commonParams.filter_by = \`year: >=${yearFrom}\``
  - If only `yearTo` exists: `commonParams.filter_by = \`year: <=${yearTo}\``
- **Execute Multi-Search:** Call the Typesense client's multi-search endpoint.

  ```typescript
  const response = await client.multiSearch.perform({ searches }, commonParams);
  ```

- **Extract Data:** When `union: true` is passed, Typesense merges the queries and returns the unified dataset inside the first element of the `results` array. Extract and return `hits` and `found`:

  ```typescript
  const mergedResult = response.results[0];
  const hits = mergedResult.hits || [];
  const totalFound = mergedResult.found || 0;

  return [hits as SearchResult[], totalFound];
  ```
