---
description: Fix SpatialInput dropdown never rendering on transcribe pages by wiring KnownLocationsContext.Provider via Server Component wrappers and documenting the LocationIQ key
status: draft
targets:
  - src/app/transcribe/create/page.tsx
  - src/app/transcribe/create/page-content.tsx (create)
  - src/app/transcribe/project/page.tsx
  - src/app/transcribe/project/page-content.tsx (create)
  - src/app/transcribe/project/_components/metadata-tab.tsx
  - src/app/transcribe/project/types.ts
  - src/app/components/contribute/spatial-input.test.tsx (create)
  - src/app/components/contribute/use-location-search.test.ts
  - .env.example
context:
  - src/app/components/contribute/spatial-input.tsx
  - src/app/components/contribute/use-location-search.ts
  - src/app/components/contribute/known-locations-context.ts
  - src/app/components/contribute/types.ts
  - src/app/services/known-locations.ts
  - src/app/services/map-points.ts
  - src/app/contribute/page.tsx
  - src/app/components/contribute/contribute-form.tsx
---

# Fix: SpatialInput Dropdown Never Renders on Transcribe Pages

## 1. Architectural Boundary

- **Execution Context:** Client (Next.js 15, React 19)
- **Data Scope:** Static build-time import — no runtime fetch, no API endpoint

---

## 2. Root Cause Analysis

Two independent, compounding failures prevent the dropdown from ever rendering on
`/transcribe/create` and `/transcribe/project`.

### Root Cause 1 — Missing `KnownLocationsContext.Provider`

`SpatialInput` calls `useKnownLocations()` internally (line 34 of `spatial-input.tsx`).
`KnownLocationsContext` has a default value of `[]`. The provider is only mounted inside
`contribute-form.tsx`, which is only used on `/contribute`.

Neither transcribe page wraps `SpatialInput` in the provider. Therefore:

```ts
// use-location-search.ts — with knownLocations = []

// Empty query path (on focus):
setResults(knownLocations.slice(0, 10).map(...))  // → []
// results.length > 0 is false → dropdown never renders on focus

// Non-empty query path (after typing):
const localLocations = knownLocations.filter(...)  // → []
setResults(localLocations)                          // → []
// After debounce + autocomplete → falls back to localLocations = []
// results.length > 0 is still false → dropdown never renders after typing
```

The dropdown render condition in `spatial-input.tsx` line 144:

```ts
{showDropdown && !value && results.length > 0 && (
```

is permanently `false` because `results` is always `[]`.

### Root Cause 2 — `NEXT_PUBLIC_LOCATIONIQ_KEY` absent from `.env.example`

The key is injected only at CI build time (`.github/workflows/main.yml` line 129).
It is absent from every local env file. In `locationiq.ts` line 32:

```ts
if (!environment.NEXT_PUBLIC_LOCATIONIQ_KEY) {
  return;
}
```

`autocomplete()` silently returns `undefined` in local development. Remote results
never arrive. The key is not listed in `.env.example`, so developers have no signal
that it exists.

### Why the Previous Fix (spec 078) Did Not Help

Spec 078 removed the `_.throttle` wrapper from `autocomplete()`, restoring the
Promise contract. That fix was correct and has been applied. However, it addressed
the transport layer — the data availability layer was never touched. Even with a
correct Promise, `results` stays `[]` because `knownLocations` is `[]`.

---

## 3. Correct Pattern (Reference Implementation)

`src/app/contribute/page.tsx` is a **Server Component** that imports `knownLocations`
(a top-level-`await` async module) and passes it as a prop to `ContributeForm`
(a `'use client'` component). `ContributeForm` then places the provider:

```
contribute/page.tsx          ← Server Component, imports knownLocations
  └─ ContributeForm          ← 'use client', receives knownLocations as prop
       └─ KnownLocationsContext.Provider value={knownLocations}
            └─ ContributeFormStepper
                 └─ SpatialInput  ← useKnownLocations() returns real data
```

Both transcribe pages are `'use client'` — they cannot directly import the async
`known-locations.ts` module. The same Server Component wrapper pattern must be applied.

---

## 4. State Transition Matrix

### Before Fix

```
User focuses input → showDropdown=true, results=[] → dropdown hidden
User types 'Kyiv'  → localLocations=[], setResults([]) → dropdown hidden
                   → debounce 500ms → autocomplete() → undefined (no key)
                   → results stays [] → dropdown hidden
```

### After Fix (key absent, local dev)

```
User focuses input → showDropdown=true, results=[top-10 local] → dropdown renders
User types 'Kyiv'  → localLocations=[{Kyiv,...}], setResults([{Kyiv,...}]) → dropdown renders
                   → debounce 500ms → autocomplete() → undefined (no key)
                   → results stays [localLocations] → dropdown renders local-only
```

### After Fix (key present, production)

```
User focuses input → showDropdown=true, results=[top-10 local] → dropdown renders
User types 'Kyiv'  → localLocations=[{Kyiv,...}], setResults([{Kyiv,...}]) → dropdown renders
                   → debounce 500ms → autocomplete() → [{display_name:'Kyiv, Ukraine',...}]
                   → setResults([...localLocations, ...remoteResults]) → dropdown renders merged
```

---

## 5. Execution Pipeline

### 5.1. `.env.example`

Add the following block before the final line of the file:

```
# Optional: LocationIQ API key for location autocomplete in SpatialInput.
# Obtain a free key at https://locationiq.com
NEXT_PUBLIC_LOCATIONIQ_KEY=
```

---

### 5.2. `src/app/transcribe/create/page.tsx` → split into two files

**Current state:** A single `'use client'` file containing all form logic.

**Target state:** Split into a thin Server Component entry point and the existing
client form content.

#### 5.2.1. `src/app/transcribe/create/page-content.tsx` _(create)_

- Move all current content of `page.tsx` into this new file.
- The file retains `'use client'` at the top.
- Add `knownLocations` as a prop:

```ts
interface CreatePageContentProperties {
  knownLocations: Location[];
}

export default function CreatePageContent({
  knownLocations,
}: CreatePageContentProperties) { ... }
```

- Import `KnownLocationsContext` from `@/app/components/contribute/known-locations-context`.
- Wrap the `<Controller name="location" ...>` block (and its error paragraph) in
  `<KnownLocationsContext.Provider value={knownLocations}>`:

```tsx
<KnownLocationsContext.Provider value={knownLocations}>
  <div>
    <Controller
      name="location"
      control={control}
      render={({ field }) => (
        <SpatialInput
          value={field.value.join(',') || ''}
          onChange={(value) => {
            if (!value) {
              field.onChange();
              return;
            }
            const [lat, lng] = value.split(',').map(Number);
            field.onChange([lat, lng]);
          }}
        />
      )}
    />
    {errors.location && (
      <p className={styles.error}>{errors.location.message}</p>
    )}
  </div>
</KnownLocationsContext.Provider>
```

- Import `type Location` from `@/app/components/contribute/types`.

#### 5.2.2. `src/app/transcribe/create/page.tsx` _(replace content)_

Replace the entire file with a Server Component that imports `knownLocations` and
renders `CreatePageContent`:

```ts
// No 'use client' directive — this is a Server Component
import knownLocations from '@/app/services/known-locations';

import CreatePageContent from './page-content';

export default function ProjectCreatePage() {
  return <CreatePageContent knownLocations={knownLocations} />;
}
```

No `metadata` export is needed on this page (none exists currently).

---

### 5.3. `src/app/transcribe/project/types.ts`

Add `knownLocations` to `MetadataTabProperties`:

```ts
import type { Location } from '@/app/components/contribute/types';

export interface MetadataTabProperties {
  schemas: { enabled: boolean; label: string; value: string }[];
  onSubmit: (event: React.SyntheticEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
  knownLocations: Location[]; // ← add this field
}
```

---

### 5.4. `src/app/transcribe/project/_components/metadata-tab.tsx`

- Destructure `knownLocations` from props.
- Import `KnownLocationsContext` from `@/app/components/contribute/known-locations-context`.
- Wrap the `<Controller name="location" ...>` block (and its error paragraph) in
  `<KnownLocationsContext.Provider value={knownLocations}>`, identical to §5.2.1.

---

### 5.5. `src/app/transcribe/project/page.tsx` → split into two files

**Current state:** A single `'use client'` file containing all project page logic.

**Target state:** Split into a thin Server Component entry point and the existing
client page content.

#### 5.5.1. `src/app/transcribe/project/page-content.tsx` _(create)_

- Move all current content of `page.tsx` into this new file.
- The file retains `'use client'` at the top.
- Add `knownLocations` as a prop to `ProjectDetailsPageContent`:

```ts
interface ProjectDetailsPageContentProperties {
  knownLocations: Location[];
}

function ProjectDetailsPageContent({
  knownLocations,
}: ProjectDetailsPageContentProperties) { ... }
```

- Pass `knownLocations={knownLocations}` to `<MetadataTab>`:

```tsx
<MetadataTab
  schemas={schemas}
  onSubmit={handleFormSubmit}
  isSubmitting={isSubmitting}
  knownLocations={knownLocations}
/>
```

- The `ProjectDetailsPage` default export (the `Suspense` wrapper) also receives
  `knownLocations` as a prop and passes it through to `ProjectDetailsPageContent`.
- Import `type Location` from `@/app/components/contribute/types`.

#### 5.5.2. `src/app/transcribe/project/page.tsx` _(replace content)_

Replace the entire file with a Server Component:

```ts
// No 'use client' directive — this is a Server Component
import knownLocations from '@/app/services/known-locations';

import ProjectPageContent from './page-content';

export default function ProjectDetailsPage() {
  return <ProjectPageContent knownLocations={knownLocations} />;
}
```

---

## 6. Agentic Verification

```bash
# Type & lint
./scripts/opencode-check.sh src/app/transcribe/create/page.tsx
./scripts/opencode-check.sh src/app/transcribe/create/page-content.tsx
./scripts/opencode-check.sh src/app/transcribe/project/page.tsx
./scripts/opencode-check.sh src/app/transcribe/project/page-content.tsx
./scripts/opencode-check.sh src/app/transcribe/project/_components/metadata-tab.tsx
./scripts/opencode-check.sh src/app/transcribe/project/types.ts

# Tests
yarn test src/app/components/contribute/spatial-input.test.tsx
yarn test src/app/components/contribute/use-location-search.test.ts
```

---

## 7. Test Plan

### 7.1. `src/app/components/contribute/spatial-input.test.tsx` _(create)_

**Runner:** Vitest + `@testing-library/react`.
**Timers:** `vi.useFakeTimers()` in `beforeEach`; `vi.useRealTimers()` in `afterEach`.

**Mocks required:**

```ts
vi.mock('@/app/services/locationiq', () => ({
  autocomplete: vi.fn(),
}));

vi.mock('posthog-js/react', () => ({
  usePostHog: () => ({ capture: vi.fn() }),
}));

vi.mock('./location-picker', () => ({
  default: () => <div data-testid="location-picker" />,
}));
```

**Do not mock** `known-locations-context` — use the real context with a controlled
`KnownLocationsContext.Provider` in the render wrapper.

**Shared fixture:**

```ts
const mockKnownLocations: Location[] = [
  { coordinates: [50.45, 30.52], title: 'Kyiv' },
  { coordinates: [49.84, 24.03], title: 'Lviv' },
];

function renderSpatialInput(
  props: { value: string; onChange: ReturnType<typeof vi.fn> },
  locations: Location[] = mockKnownLocations,
) {
  return render(
    <KnownLocationsContext.Provider value={locations}>
      <SpatialInput {...props} />
    </KnownLocationsContext.Provider>,
  );
}
```

**Test cases:**

| #   | Description                                                                                     | Action                                                                                                                                                                | Assertion                                                                      |
| --- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 1   | Dropdown absent on initial mount                                                                | Render with `value=''`, no interaction                                                                                                                                | `queryByRole('listbox')` → `null`                                              |
| 2   | Dropdown renders on focus with local results                                                    | `fireEvent.focus` on `#location-search`                                                                                                                               | `getByRole('listbox')` present; 2 elements with `role="option"`                |
| 3   | Dropdown absent when `value` is non-empty                                                       | Render with `value='50.45,30.52'`; fire focus                                                                                                                         | `queryByRole('listbox')` → `null`                                              |
| 4   | Dropdown renders filtered local results on typing                                               | `fireEvent.change` with `target.value='Kyiv'`                                                                                                                         | `getByRole('listbox')` present; exactly 1 option containing text `'Kyiv'`      |
| 5   | **Regression:** Dropdown absent when `knownLocations=[]` and `autocomplete` returns `undefined` | Render with `locations=[]`; `autocomplete` mocked to resolve `undefined`; type `'Kyiv'`; `vi.advanceTimersByTime(500)`; await resolution                              | `queryByRole('listbox')` → `null`                                              |
| 6   | Dropdown renders remote results when `autocomplete` resolves                                    | Render with `locations=[]`; `autocomplete` resolves `[{ display_name: 'Kyiv, Ukraine', lat: 50.45, lon: 30.52, place_id: '1' }]`; type `'Kyiv'`; advance 500ms; await | `getByRole('listbox')` present; option containing `'Kyiv, Ukraine'` visible    |
| 7   | Selecting item calls `onChange` and closes dropdown                                             | Focus; click `'Kyiv'` option                                                                                                                                          | `onChange` called once with `'50.45,30.52'`; `queryByRole('listbox')` → `null` |
| 8   | Dropdown closes on outside click                                                                | Focus; assert listbox present; `fireEvent.mouseDown(document.body)`                                                                                                   | `queryByRole('listbox')` → `null`                                              |

Test 5 is the critical regression guard. It must pass both before and after the fix,
asserting that the degradation boundary (no context data + no API key = no dropdown)
is intentional and documented.

---

### 7.2. `src/app/components/contribute/use-location-search.test.ts` _(modify)_

Add one test to the existing `describe('useLocationSearch')` block:

```ts
it('Returns empty results when knownLocations=[] and autocomplete returns undefined', async () => {
  const { autocomplete } = await import('@/app/services/locationiq');
  vi.mocked(autocomplete).mockResolvedValueOnce(undefined);

  const { result } = renderHook(() => useLocationSearch([]));

  act(() => {
    result.current.setQuery('Kyiv');
  });

  act(() => {
    vi.advanceTimersByTime(500);
  });

  await act(async () => {
    await vi.runAllTimersAsync();
  });

  expect(result.current.results).toStrictEqual([]);
  expect(result.current.isLoading).toBe(false);
});
```

Use `toStrictEqual([])` per the deep-equality convention in `TESTING_CONVENTIONS.md`.
