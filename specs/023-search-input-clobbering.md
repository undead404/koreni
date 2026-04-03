# Search Input Clobbering Bug Fix

## Objective

Fix an input clobbering bug in `src/app/components/search.tsx` where typing in the search field gets erased when search results resolve.

## Flaw Description

The first `useEffect` synchronously overwrites the local `inputValue` state with the URL query every time the effect runs. If the component re-renders and the effect dependencies trigger before the 400ms debounce commits the new input to the URL, the input reverts to the stale URL state.

## Required Changes

File: `src/app/components/search.tsx`

1. Extract the `activeQuery` string primitive out of the `useEffect` to use as a stable dependency.
2. Split the existing `useEffect` into two separate effects:
   - **Effect A (Data Fetching):** Strictly handles `handleSearch`.
   - **Effect B (Navigation Sync):** Synchronizes `inputValue` with the URL only when the URL actually changes (e.g., browser Back/Forward navigation).
3. In Effect B, conditionally update `inputValue` only if `inputValue.trim() !== activeQuery`. This ensures trailing spaces aren't deleted while the user is actively typing.

## Code Replacement

Locate this block in `src/app/components/search.tsx`:

```tsx
// 2. The URL is the single source of truth for fetching data.
// When the URL changes (via debounce or back/forward buttons), execute the search.
useEffect(() => {
  const activeQuery = searchParameters.get('query') || '';
  setInputValue(activeQuery); // Sync local state in case of browser navigation
  void handleSearch(activeQuery, currentPage);
}, [currentPage, handleSearch, searchParameters]);
```

Replace it entirely with:

```tsx
const activeQuery = searchParameters.get('query') || '';

// 2a. Sync local state strictly on external browser navigation (Back/Forward).
// Compare trimmed values to prevent erasing trailing spaces during active typing.
useEffect(() => {
  if (inputValue.trim() !== activeQuery) {
    setInputValue(activeQuery);
  }
}, [activeQuery, inputValue]);

// 2b. The URL is the single source of truth for fetching data.
useEffect(() => {
  void handleSearch(activeQuery, currentPage);
}, [activeQuery, currentPage, handleSearch]);
```
