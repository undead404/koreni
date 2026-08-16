---
description: Load saved transcription from DB into useTranscriptionRows; validate with Zod schema derived from columns.
status: draft
targets:
  - src/server/src/handlers/handle-project-image-get.ts
  - src/server/src/handlers/handle-project-image-get.test.ts
  - src/app/transcribe/schemata.ts
  - src/app/transcribe/api/get-project-image.ts
  - src/app/transcribe/workspace/_hooks/use-transcription-rows.ts
  - src/app/transcribe/workspace/_hooks/use-transcription-rows.test.ts
context:
  - src/server/src/database/schema.sql
  - src/server/src/database/find-project-image.ts
  - src/server/src/handlers/handle-project-image-patch.ts
  - src/app/transcribe/schemata.ts
  - src/app/transcribe/api/request.ts
---

# Transcription Hydration from Database

## 1. Architectural Boundary

- **Execution Context:** Server (Hono) + Client (Next.js & React 19)
- **Data Scope:** SQLite (Kysely) → HTTP JSON → Local State

---

## 2. State Transition Matrix

### Fault / Current State

- **Condition:** `imageId` changes (user navigates to a new image) or the workspace first mounts.
- **Behavior:** `useTranscriptionRows` always resets to a single empty row, discarding any previously saved transcription stored in `project_images.transcription`.
- **Root cause — backend:** `handle-project-image-get.ts` maps the DB row to a response object but omits the `transcription` column, even though `findProjectImage` already selects it.
- **Root cause — frontend:** No API call is made to fetch the single image on `imageId` change; there is no Zod schema for the `transcription` field; and the hook has no hydration path.

```ts
// handle-project-image-get.ts — transcription is silently dropped
return c.json({
  success: true,
  image: {
    id: image.id,
    // ... all other fields ...
    // ❌ transcription: image.transcription  ← missing
  },
});

// use-transcription-rows.ts — always resets to empty
useEffect(() => {
  if (imageId) {
    setRows([createEmptyRow()]); // ❌ never hydrates from DB
    lastSavedReference.current = '';
  }
}, [imageId, createEmptyRow]);
```

### Target / Resolved State

- **Condition:** `imageId` becomes defined (or changes).
- **Behavior:**
  1. The backend GET handler includes `transcription: image.transcription` (`string | null`) in its JSON response.
  2. The frontend fetches the single image via `GET /api/transcribe/projects/:projectId/images/:imageId`.
  3. The raw response is parsed with Zod. The `transcription` field is then JSON-parsed into `unknown` and validated against a **dynamically-derived row schema** built from the `columns` prop.
  4. Each row is guaranteed a valid UUID `id` by the Zod `.uuid()` constraint.
  5. If `transcription` is `null`, empty, or fails any parse/validation step, the hook falls back to a single empty row.
  6. `lastSavedReference.current` is initialised to `JSON.stringify(hydratedRows)` so the auto-save does **not** immediately fire a redundant PATCH.
  7. `isHydrating: boolean` is exposed from the hook so the workspace page can disable the table while the fetch is in-flight.

```ts
// Target shape returned by GET handler
{
  success: true,
  image: {
    id: string,
    projectId: string,
    storageKey: string,
    url: string,
    pageSequence: number,
    pageName: string | null,
    height: number | null,
    width: number | null,
    createdAt: number | null,
    blurhash: string | null,
    transcription: string | null,   // ← added
  }
}

// Target Zod row schema (derived at runtime from columns)
// Given columns = [{ id: 'HH', expectedType: 'number' }, { id: 'Name', expectedType: 'string' }]
const rowSchema = z.object({
  id: z.string().uuid(),
  HH: z.string(),   // all column values are stored as strings regardless of expectedType
  Name: z.string(),
});
```

---

## 3. Data Flow

```
DB: project_images.transcription (TEXT | NULL)
  │
  ▼
findProjectImage()           ← already selects `transcription`
  │
  ▼
handleProjectImageGet()      ← ADD: transcription: image.transcription
  │  JSON: { image: { ..., transcription: string | null } }
  ▼
GET /api/transcribe/projects/:projectId/images/:imageId
  │
  ▼
getProjectImage()            ← NEW frontend API service function
  │  Zod-parses response with updated projectImageSchema
  ▼
useTranscriptionRows()       ← imageId-change effect
  │  1. setRows([createEmptyRow()]) + setIsHydrating(true)
  │  2. Fetch via getProjectImage()
  │  3. JSON.parse(transcription)  →  unknown
  │  4. Validate with dynamically-built rowArraySchema (from columns)
  │  5. setRows(hydratedRows) OR setRows([createEmptyRow()])
  │  6. lastSavedReference.current = JSON.stringify(finalRows)
  │  7. setIsHydrating(false)
  ▼
React state: TranscriptionRow[]
```

---

## 4. Execution Pipeline

### 4.1. `src/server/src/handlers/handle-project-image-get.ts`

1. In the `c.json(...)` response object, add `transcription: image.transcription` alongside the existing fields. The value is `string | null` as returned by Kysely.
2. No other logic changes.

### 4.2. `src/server/src/handlers/handle-project-image-get.test.ts`

1. Update the happy-path test's `expect` assertion to include `transcription: null` in the expected `image` object (the mock fixture already sets `transcription: null`).
2. Add a second happy-path case where `transcription` is a non-null string, asserting it is passed through verbatim.

### 4.3. `src/app/transcribe/schemata.ts`

1. Add `transcription: z.string().nullable().optional()` to `projectImageSchema`.
2. The inferred `ProjectImage` type automatically gains the field.

### 4.4. `src/app/transcribe/api/get-project-image.ts` _(new file)_

1. Export a default async function `getProjectImage(projectId: string, imageId: string, signal?: AbortSignal): Promise<ProjectImage>`.
2. Call `requestApi(`/api/transcribe/projects/${projectId}/images/${imageId}`, { signal })`.
3. Parse the response JSON as `unknown`, then validate with a local transport-envelope schema:
   ```ts
   const projectImageResponseSchema = z.object({
     success: z.boolean(),
     image: projectImageSchema,
   });
   ```
4. Return `parsed.image`.
5. Let errors propagate — the caller handles them.

### 4.5. `src/app/transcribe/workspace/_hooks/use-transcription-rows.ts`

#### 4.5.1. Schema derivation helper

Define a pure function `buildRowArraySchema(columns: ColumnConfig[])` that:

- Constructs `z.object({ id: z.string().uuid(), ...columnFields })` where each column contributes `[column.id]: z.string()`.
- Returns `z.array(rowObjectSchema)`.
- Is called via `useMemo` keyed on `columns`.

#### 4.5.2. `imageId`-change effect (replaces existing reset effect)

```
Trigger: imageId or projectId changes
Guard:   if (!imageId || !projectId) → setRows([createEmptyRow()]); setIsHydrating(false); return
Steps:
  1. setRows([createEmptyRow()])          // optimistic reset while loading
  2. lastSavedReference.current = ''
  3. setIsHydrating(true)
  4. Call getProjectImage(projectId, imageId, abortController.signal)
  5. On success:
       a. If image.transcription is null/empty → use [createEmptyRow()]
       b. Else:
            i.  JSON.parse(image.transcription) → unknown (try/catch)
            ii. rowArraySchema.safeParse(parsed)
            iii.If .success → finalRows = result.data
            iv. If .failure → finalRows = [createEmptyRow()]
       c. if (abortController.signal.aborted) return
       d. setRows(finalRows)
       e. lastSavedReference.current = JSON.stringify(finalRows)
  6. On fetch/network error → keep the empty row (already set in step 1)
  7. setIsHydrating(false)  (in finally block)
```

Use an `AbortController`; clean up on unmount / dependency change.

#### 4.5.3. Return value

Add `isHydrating` to the hook's return object.

### 4.6. `src/app/transcribe/workspace/_hooks/use-transcription-rows.test.ts`

Add the following test cases (existing tests remain unchanged):

| Case                                                | Setup                                                                              | Expected                                        |
| --------------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------- |
| Hydrates rows from valid `transcription` JSON       | Mock `getProjectImage` to return `transcription: '[{"id":"uuid-1","col1":"foo"}]'` | `rows` equals `[{ id: 'uuid-1', col1: 'foo' }]` |
| Falls back to empty row on `null` transcription     | Mock returns `transcription: null`                                                 | `rows` equals `[{ id: 'test-uuid', col1: '' }]` |
| Falls back to empty row on malformed JSON           | Mock returns `transcription: 'not-json'`                                           | `rows` equals `[{ id: 'test-uuid', col1: '' }]` |
| Falls back to empty row on Zod schema mismatch      | Mock returns valid JSON but wrong shape                                            | `rows` equals `[{ id: 'test-uuid', col1: '' }]` |
| Does not fire auto-save immediately after hydration | After hydration, advance timer 120 000 ms                                          | `fetch` is **not** called                       |
| `isHydrating` is true during fetch, false after     | Mock with delayed resolution                                                       | `isHydrating` transitions `true → false`        |

---

## 5. Failure Modes & Edge Cases

| Scenario                                                     | Behaviour                                                     |
| ------------------------------------------------------------ | ------------------------------------------------------------- |
| `transcription` is `null` in DB                              | Fall back to single empty row                                 |
| `transcription` is `""` (empty string)                       | Treated as falsy; fall back to single empty row               |
| `transcription` is valid JSON but not an array               | `z.array(...).safeParse` fails; fall back                     |
| `transcription` array contains rows with extra unknown keys  | Zod `.strip()` (default) removes them silently                |
| `transcription` array contains rows with missing column keys | Zod fails; fall back to empty row                             |
| A row's `id` is not a valid UUID                             | Zod `.uuid()` fails the entire parse; fall back to empty row  |
| Network error fetching the single image                      | Empty row; no toast (silent degradation)                      |
| `imageId` changes while fetch is in-flight                   | `AbortController` cancels the stale request; new fetch begins |

---

## 6. Invariants

1. `lastSavedReference.current` is always set to `JSON.stringify(rows)` at the moment `setRows` is called during hydration — preventing a spurious auto-save.
2. `buildRowArraySchema` is pure and has no side-effects.
3. `getProjectImage` is the only place that calls `requestApi` for this endpoint.
4. All column values in `TranscriptionRow` remain `string` — `expectedType` is a UI hint only.

---

## 7. Agentic Verification

```bash
# Type & lint — backend handler
./scripts/opencode-check.sh src/server/src/handlers/handle-project-image-get.ts

# Type & lint — frontend files
./scripts/opencode-check.sh src/app/transcribe/schemata.ts
./scripts/opencode-check.sh src/app/transcribe/api/get-project-image.ts
./scripts/opencode-check.sh src/app/transcribe/workspace/_hooks/use-transcription-rows.ts

# Backend tests
cd src/server && yarn test src/handlers/handle-project-image-get.test.ts

# Frontend tests
yarn test src/app/transcribe/workspace/_hooks/use-transcription-rows.test.ts
```
