---
description: Remove _.throttle wrapper from autocomplete in locationiq service to restore Promise contract and fix LocationIQ search in SpatialInput
status: draft
targets:
  - src/app/services/locationiq.ts
  - src/app/__mocks__/environment.ts
context:
  - src/app/components/contribute/use-location-search.ts
  - src/app/components/contribute/spatial-input.tsx
  - src/app/environment.ts
---

# Fix: LocationIQ Search Broken in SpatialInput

## 1. Architectural Boundary

- **Execution Context:** Client (Next.js & React 19)
- **Data Scope:** N/A

---

## 2. State Transition Matrix

### Fault / Current State

- **Condition:** User types into the location search input in `SpatialInput`. The `useLocationSearch` hook debounces 500ms then calls `autocomplete(query, abortController)`. Any call within the 500ms `_.throttle` window returns `undefined` instead of a `Promise`.
- **Behavior:** `.then()` is called on `undefined`, throwing `TypeError: Cannot read properties of undefined (reading 'then')`. The `.catch()` silently swallows it. Remote LocationIQ results never appear.
- **Log/Trace:**

```ts
// locationiq.ts — current broken export
export const autocomplete = _.throttle(autocompleteBounced, 500);
// _.throttle returns undefined for suppressed calls, not a Promise

// use-location-search.ts — consumer
autocomplete(query, abortController)  // ← undefined on suppressed call
  .then((data) => { ... })            // ← TypeError thrown here
  .catch(() => {                      // ← silently swallowed; remote results lost
    setResults(localLocations);
  });
```

### Target / Resolved State

- **Condition:** User types into the location search input. The hook's own `setTimeout(500)` debounce fires and calls `autocomplete(query, abortController)`. The function always returns a `Promise`.
- **Behavior:** `.then()` receives the resolved array of remote results. `setResults` merges local and remote entries. The dropdown renders both `origin: 'local'` and `origin: 'remote'` items.
- **Schema/Type Alteration:**

```ts
// locationiq.ts — fixed export
export async function autocomplete(
  query: string,
  abortController: AbortController,
): Promise<
  | Array<{ display_name: string; lat: number; lon: number; place_id: string }>
  | undefined
>;
// Signature unchanged. Lodash import removed. No wrapper.
```

---

## 3. Execution Pipeline

### 3.1. `src/app/services/locationiq.ts`

1. Remove `import _ from 'lodash'` — the only usage of lodash in this file is `_.throttle`.
2. Rename `autocompleteBounced` to `autocomplete`.
3. Change the declaration from `async function autocompleteBounced` to `export async function autocomplete`. Remove the `export const autocomplete = _.throttle(...)` line entirely.
4. All internal logic (key guard, `fetch`, Zod parse, error handling, telemetry) remains unchanged.

### 3.2. `src/app/__mocks__/environment.ts`

1. Add `NEXT_PUBLIC_LOCATIONIQ_KEY: 'test-locationiq-key'` to the mock object so tests of `locationiq.ts` do not short-circuit on the key guard.

### 3.3. `src/app/services/locationiq.test.ts` _(create)_

Implement the following test suites using MSW for network interception (`onUnhandledRequest: 'error'`). Mock `@/app/services/bugsnag` and `posthog-js`.

**Suite: `autocomplete`**

| Test                                                         | MSW handler                                                                             | Assertion                                                                                     |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Returns parsed results on 200                                | `GET /v1/autocomplete` → `200 [{ display_name, lat: '50.45', lon: '30.52', place_id }]` | `toStrictEqual([{ ..., lat: 50.45, lon: 30.52 }])` — assert numeric transform                 |
| Returns `undefined` when API key is absent                   | No handler needed                                                                       | `toBeUndefined()`; assert `fetch` never called                                                |
| Returns `undefined` and fires telemetry on non-OK response   | `GET /v1/autocomplete` → `422 { error: 'Invalid key' }`                                 | `toBeUndefined()`; `initBugsnag().notify` called once; `posthog.captureException` called once |
| Returns `undefined` and fires telemetry on Zod parse failure | `GET /v1/autocomplete` → `200 [{ unexpected: true }]`                                   | `toBeUndefined()`; `initBugsnag().notify` called once                                         |
| Returns `undefined` when aborted                             | MSW handler with delay; abort before resolve                                            | `toBeUndefined()`; no unhandled rejection                                                     |

**Suite: `reverseGeocode`**

| Test                                                     | MSW handler                                                 | Assertion                           |
| -------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------- |
| Returns `display_name` string on 200                     | `GET /v1/reverse` → `200 { display_name: 'Kyiv, Ukraine' }` | `toStrictEqual('Kyiv, Ukraine')`    |
| Returns `undefined` when API key is absent               | No handler needed                                           | `toBeUndefined()`                   |
| Returns `undefined` and fires telemetry on network error | MSW network error                                           | `toBeUndefined()`; telemetry called |

### 3.4. `src/app/components/contribute/use-location-search.test.ts` _(create)_

Implement the following test suite using `renderHook` + `vi.useFakeTimers()`. Mock `@/app/services/locationiq` with `vi.mock`.

| Test                                                                  | Assertion                                                                                                 |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Returns top-10 known locations when query is empty                    | `results.length === 10`; all `origin: 'local'`; `isLoading === false`                                     |
| Filters known locations immediately on query change (before debounce) | Matching local entry present in `results` before `vi.advanceTimersByTime(500)`                            |
| Sets `isLoading: true` after debounce fires                           | `isLoading === true` after `vi.advanceTimersByTime(500)`                                                  |
| Merges remote results after `autocomplete` resolves                   | `results` contains both local and remote entries; remote tagged `origin: 'remote'`; `isLoading === false` |
| Falls back to local results when `autocomplete` returns `undefined`   | `results` contains only local entries; `isLoading === false`                                              |
| Falls back to local results when `autocomplete` rejects               | `results` contains only local entries; `isLoading === false`                                              |
| Does not update results after unmount                                 | `setResults` not called after unmount; no act warning                                                     |
| Cancels previous debounce on rapid query changes                      | `autocomplete` called exactly once on rapid `setQuery` succession                                         |

---

## 4. Agentic Verification

Execute the following commands to validate the implementation:

1. **Type & Lint Pass:**

```bash
./scripts/opencode-check.sh src/app/services/locationiq.ts
./scripts/opencode-check.sh src/app/__mocks__/environment.ts
```

2. **Targeted Test Execution:**

```bash
yarn test src/app/services/locationiq.test.ts
yarn test src/app/components/contribute/use-location-search.test.ts
```
