# Aider Prompt: Implement Year Range Filtering for TypeSense Search

## Objective

Add "Year From" and "Year To" filters to the search interface. The state must be strictly driven by the Next.js URL search parameters (`year_from`, `year_to`) and mapped to local state as `yearFrom` and `yearTo`. Apply filtering natively using Typesense's numeric range syntax.

## File Modifications

### 1. `src/app/services/search.ts`

- Update the `SearchParameters` interface to include optional string properties: `yearFrom?: string` and `yearTo?: string`.
- Update the `searchInCollection` function signature to accept `yearFrom` and `yearTo`.
- Inside `searchInCollection`, conditionally add a `filter_by` property to the Typesense search configuration object. Use native range syntax:
  - If both `yearFrom` and `yearTo` exist: `year: [${yearFrom}..${yearTo}]`
  - If only `yearFrom` exists: `year: >=${yearFrom}`
  - If only `yearTo` exists: `year: <=${yearTo}`
- Update the `search` function to extract `yearFrom` and `yearTo` from the arguments and pass them down to all three `searchInCollection` calls.

### 2. `src/app/hooks/use-search.tsx`

- Update the `handleSearch` callback signature to accept: `(value: string, yearFrom: string, yearTo: string, page: number = 1)`.
- Pass `yearFrom` and `yearTo` directly into the `search` service call.
- Update the `posthog.capture` calls to include `year_from: yearFrom` and `year_to: yearTo` in the tracking payload.

### 3. `src/app/components/search-controls.tsx`

- Update `ControlsProperties` to strictly use this interface:

  ```typescript
  interface ControlsProperties {
    filters: { query: string; yearFrom: string; yearTo: string };
    onQueryChange: (query: string) => void;
    onYearCommit: (yearFrom: string, yearTo: string) => void;
  }
  ```

- Remove the `CustomEvent` logic entirely.
- Add two new `<input type="number">` fields for "Year From" and "Year To".
- Maintain local React state for the year inputs (`localYearFrom`, `localYearTo`) so the user can type freely.
- Bind the `onChange` event of the text input directly to `onQueryChange(e.target.value)`.
- Bind the year inputs to update their local state on `onChange`, but **only** trigger `onYearCommit(localYearFrom, localYearTo)` during `onBlur` and `onKeyDown` (if `event.key === 'Enter'`). Do not trigger `onYearCommit` on every keystroke.

### 4. `src/app/components/search.tsx`

- Extract parameters from `useSearchParams()`: `query`, `year_from`, and `year_to`.
- Replace the individual `inputValue` state and `lastPushedQuery` ref with a single unified state object:

  ```typescript
  const [filters, setFilters] = useState({
    query: searchParameters.get('query') || '',
    yearFrom: searchParameters.get('year_from') || '',
    yearTo: searchParameters.get('year_to') || '',
  });
  ```

- Pass the `filters` object, `onQueryChange`, and `onYearCommit` down to `<SearchControls />`. Update `filters` state via these callbacks.
- Update the `handleSearch` `useEffect` to pass the active URL parameters (not local state) to `handleSearch(activeQuery, activeYearFrom, activeYearTo, currentPage)`.
- Update the debouncing `useEffect` (Step 3 in the original file):
  - Diff the local `filters` object against the parsed `searchParameters`.
  - Apply the 400ms debounce strictly to router pushes.
  - When constructing the new `URLSearchParams`, strictly map `filters.yearFrom` to the `year_from` URL key, and `filters.yearTo` to the `year_to` URL key. Use `set` if they hold values, or `delete` if empty.
  - Reset the `page` parameter to `1` whenever the query or either year filter changes.
