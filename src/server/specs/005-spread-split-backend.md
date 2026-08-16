---
description: Introduce project_image_sources table and spread-split endpoints; link project_images to sources via source_id; add split/unsplit/resequence API.
status: draft
targets:
  - src/server/src/database/schema.sql
  - src/server/src/database/create-image-source.ts
  - src/server/src/database/create-image-source.test.ts
  - src/server/src/database/find-image-source.ts
  - src/server/src/database/find-image-source.test.ts
  - src/server/src/database/create-derived-pages.ts
  - src/server/src/database/create-derived-pages.test.ts
  - src/server/src/database/revert-split.ts
  - src/server/src/database/revert-split.test.ts
  - src/server/src/database/get-project-images.ts
  - src/server/src/database/create-project.ts
  - src/server/src/handlers/handle-image-source-put.ts
  - src/server/src/handlers/handle-image-source-put.test.ts
  - src/server/src/handlers/handle-spread-split-post.ts
  - src/server/src/handlers/handle-spread-split-post.test.ts
  - src/server/src/handlers/handle-spread-revert-delete.ts
  - src/server/src/handlers/handle-spread-revert-delete.test.ts
  - src/server/src/handlers/handle-project-image-put.ts
  - src/server/src/schemata.ts
  - src/server/src/app.ts
context:
  - src/server/src/database/schema.sql
  - src/server/src/database/client.ts
  - src/server/src/database/create-project.ts
  - src/server/src/database/get-project-images.ts
  - src/server/src/database/find-project-image.ts
  - src/server/src/handlers/handle-project-image-put.ts
  - src/server/src/schemata.ts
  - src/server/src/app.ts
---

# Spread Split — Backend: Schema, Sources, and Split Endpoints

## 1. Architectural Boundary

- **Execution Context:** Server (Hono)
- **Data Scope:** SQLite (Kysely) — schema migration + new DB functions + new route handlers

---

## 2. State Transition Matrix

### Current State

- `project_images` is the only image entity. Every uploaded image is both the raw asset and the editable page.
- There is no concept of provenance: if an image is a two-page spread, there is no way to model it without destroying the original record.
- `project_images.storage_key` always points to the full original scan in R2.

### Target State

- A new `project_image_sources` table represents the **original uploaded asset** (the source of truth). It owns the R2 `storage_key`.
- `project_images` becomes strictly **derived editable pages**. Each row references a `source_id`.
- For a non-split image: one source → one `project_images` row (`page_count = 1`, `crop_x = null`).
- For a split spread: one source → two `project_images` rows (`page_count = 2`), each with a `crop_x` ratio and `side` (`'left'` | `'right'`).
- Reverting a split soft-deletes the two derived rows (`is_active = false`) without touching R2 or the source row.

```ts
// Target: new columns on project_images
interface ProjectImages {
  // existing columns unchanged
  source_id: string; // FK → project_image_sources.id
  crop_x: number | null; // 0–1 ratio of image width; null = no crop
  side: 'left' | 'right' | null; // which half of the spread; null = full image
  is_active: number; // 1 = visible, 0 = soft-deleted (reverted split)
}

// Target: new table
interface ProjectImageSources {
  id: string;
  project_id: string;
  storage_key: string; // R2 key — never changes after upload
  width: number;
  height: number;
  blurhash: string;
  page_count: number; // 1 = single page, 2 = spread (split into two)
  created_at: number; // unixepoch()
}
```

---

## 3. Schema Changes

### 3.1. `src/server/src/database/schema.sql`

Add the following table **before** `project_images`:

```sql
CREATE TABLE `project_image_sources` (
  `id` text PRIMARY KEY NOT NULL,
  `project_id` text NOT NULL,
  `storage_key` text NOT NULL,
  `width` integer NOT NULL,
  `height` integer NOT NULL,
  `blurhash` text NOT NULL,
  `page_count` integer DEFAULT 1 NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  CONSTRAINT `source_belongs_to_project` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE
);
```

Alter `project_images` to add four new columns:

```sql
ALTER TABLE `project_images` ADD COLUMN `source_id` text REFERENCES `project_image_sources`(`id`) ON DELETE CASCADE;
ALTER TABLE `project_images` ADD COLUMN `crop_x` real;
ALTER TABLE `project_images` ADD COLUMN `side` text;
ALTER TABLE `project_images` ADD COLUMN `is_active` integer DEFAULT 1 NOT NULL;
```

**Constraints:**

- `source_id` is nullable only for backward-compatibility with existing rows. All new rows must supply it.
- `side` must be `'left'`, `'right'`, or `NULL`. Enforced at the application layer via Zod, not at the DB layer (SQLite CHECK constraint portability with Turso is not guaranteed).
- `is_active` defaults to `1`. Only the revert operation sets it to `0`.

---

## 4. New Zod Schemas — `src/server/src/schemata.ts`

Add the following schemas to the existing file. Do not define them inline in handlers.

```ts
export const imageSourceCreateSchema = z.object({
  id: nonEmptyString,
  projectId: nonEmptyString,
  storageKey: nonEmptyString,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  blurhash: nonEmptyString,
});
export type ImageSourceCreate = z.infer<typeof imageSourceCreateSchema>;

export const spreadSplitSchema = z.object({
  sourceId: nonEmptyString,
  cropX: z.number().min(0.1).max(0.9), // ratio; reject degenerate splits
  leftPageId: nonEmptyString,
  rightPageId: nonEmptyString,
  leftPageSequence: z.number().int().nonnegative(),
  rightPageSequence: z.number().int().nonnegative(),
  leftPageName: z.string().nullable().optional(),
  rightPageName: z.string().nullable().optional(),
});
export type SpreadSplit = z.infer<typeof spreadSplitSchema>;
```

---

## 5. New Database Functions

### 5.1. `src/server/src/database/create-image-source.ts`

Export `createImageSource(data: ImageSourceCreate): Promise<void>`.

- `INSERT INTO project_image_sources` with all fields from `data`.
- Wrap in a transaction (per server conventions).
- Throw on UNIQUE constraint violation with a descriptive message: `'Source ID already exists'`.

### 5.2. `src/server/src/database/find-image-source.ts`

Export `findImageSource(sourceId: string, projectId: string): Promise<ProjectImageSources | undefined>`.

- `SELECT * FROM project_image_sources WHERE id = ? AND project_id = ?`.
- Returns `undefined` if not found (caller handles 404).

### 5.3. `src/server/src/database/create-derived-pages.ts`

Export `createDerivedPages(sourceId: string, split: SpreadSplit): Promise<void>`.

Within a **single transaction**:

1. Fetch the source row by `sourceId` to obtain `project_id`, `storage_key`, `width`, `height`, `blurhash`. Throw if not found.
2. `UPDATE project_image_sources SET page_count = 2 WHERE id = sourceId`.
3. `INSERT INTO project_images` for the left page:
   - `id = split.leftPageId`
   - `project_id` = source's `project_id`
   - `source_id = sourceId`
   - `storage_key` = source's `storage_key` (same R2 object — virtual crop)
   - `width` = source's `width`
   - `height` = source's `height`
   - `blurhash` = source's `blurhash`
   - `page_sequence = split.leftPageSequence`
   - `page_name = split.leftPageName ?? null`
   - `crop_x = split.cropX`
   - `side = 'left'`
   - `is_active = 1`
4. `INSERT INTO project_images` for the right page (same pattern, `side = 'right'`, `page_sequence = split.rightPageSequence`, `page_name = split.rightPageName ?? null`).
5. If either INSERT fails, the transaction rolls back entirely — no partial state is permitted.

### 5.4. `src/server/src/database/revert-split.ts`

Export `revertSplit(sourceId: string, projectId: string): Promise<void>`.

Within a **single transaction**:

1. Verify the source exists and belongs to the project; throw if not found.
2. `UPDATE project_images SET is_active = 0 WHERE source_id = sourceId AND is_active = 1`.
3. `UPDATE project_image_sources SET page_count = 1 WHERE id = sourceId`.

### 5.5. `src/server/src/database/get-project-images.ts` — update

Append `AND (is_active = 1 OR is_active IS NULL)` to the existing WHERE clause so soft-deleted derived pages are never returned to the client. The `IS NULL` guard preserves backward compatibility with legacy rows that predate the `is_active` column.

### 5.6. `src/server/src/database/create-project.ts` — update `createProjectImage`

Add `source_id`, `crop_x`, `side`, and `is_active` to the INSERT parameter type and values. All are optional with defaults:

- `sourceId`: optional `string | null`; defaults to `null` for backward compatibility.
- `cropX`: optional `number | null`; defaults to `null`.
- `side`: optional `'left' | 'right' | null`; defaults to `null`.
- `isActive`: always `1` on creation; not exposed as a parameter.

---

## 6. New Route Handlers

### 6.1. `PUT /api/transcribe/projects/:projectId/image-sources/:sourceId`

**Handler:** `src/server/src/handlers/handle-image-source-put.ts`

**Purpose:** Upload the original image asset and atomically create a `project_image_sources` row plus one initial `project_images` derived page row.

**Request:** `multipart/form-data`

- `file`: JPEG binary
- `blurhash`: string (pre-computed client-side)
- `pageSequence`: integer (for the single derived page created alongside the source)
- `pageName`: string | null (optional)
- `pageId`: string (the UUID for the initial `project_images` row)

**Processing (all within one transaction):**

1. Validate `projectId` and `sourceId` from path params (non-empty, alphanumeric-slug pattern via `nonEmptyString`).
2. Parse and validate the multipart body with Zod (inline schema acceptable here since it is specific to this handler's transport layer).
3. Validate file is JPEG; return `400` if not.
4. Extract dimensions via `getJpegDimensions`; return `400` on failure.
5. Upload to R2 via `uploadProjectImageToR2(projectId, sourceId, buffer, 'image/jpeg')`. R2 key: `projects/{projectId}/sources/{sourceId}.jpg`.
6. `createImageSource({ id: sourceId, projectId, storageKey: uploadResult.key, width, height, blurhash })`.
7. `createProjectImage({ id: pageId, projectId, sourceId, storageKey: uploadResult.key, pageSequence, pageName, width, height, blurhash, cropX: null, side: null })`.
8. Return `{ success: true, sourceId, pageId, url: uploadResult.url }`.

**Failure modes:**

- JPEG validation fails → `400` with `{ error: 'Only JPEG images are allowed' }`.
- Dimension extraction fails → `400` with `{ error: 'Invalid JPEG file: <message>' }`.
- R2 upload fails → `500`; do not write to DB.
- DB write fails → `500`; R2 object is orphaned (acceptable; no compensating delete required at this stage).
- `sourceId` already exists (UNIQUE constraint) → `409` with `{ error: 'Source already exists' }`.

### 6.2. `POST /api/transcribe/projects/:projectId/image-sources/:sourceId/split`

**Handler:** `src/server/src/handlers/handle-spread-split-post.ts`

**Purpose:** Confirm a spread split. Creates two derived `project_images` rows referencing the same source and R2 object.

**Request:** `application/json` matching `spreadSplitSchema`.

**Processing:**

1. Validate path params.
2. Parse body with `spreadSplitSchema.safeParse`; return `400` on failure.
3. `findImageSource(sourceId, projectId)` — return `404` if not found.
4. Guard: if `source.page_count === 2` return `409 { error: 'Source is already split' }`.
5. Call `createDerivedPages(sourceId, parsedBody)`.
6. Return `{ success: true, sourceId, leftPageId: parsedBody.leftPageId, rightPageId: parsedBody.rightPageId }`.

**Failure modes:**

- Source not found → `404`.
- Already split → `409`.
- `cropX` out of range → `400` (caught by Zod schema).
- Transaction failure → `500`; no partial rows created.

### 6.3. `DELETE /api/transcribe/projects/:projectId/image-sources/:sourceId/split`

**Handler:** `src/server/src/handlers/handle-spread-revert-delete.ts`

**Purpose:** Revert a split. Soft-deletes the two derived pages and resets `page_count` to `1`.

**Processing:**

1. Validate path params.
2. `findImageSource(sourceId, projectId)` — return `404` if not found.
3. Guard: if `source.page_count !== 2` return `409 { error: 'Source is not currently split' }`.
4. Call `revertSplit(sourceId, projectId)`.
5. Return `{ success: true }`.

**Failure modes:**

- Source not found → `404`.
- Not currently split → `409`.
- Transaction failure → `500`.

### 6.4. `src/server/src/handlers/handle-project-image-put.ts` — update

The existing handler is **not removed**. It is updated to:

- Accept an optional `sourceId` field in the multipart body.
- If `sourceId` is provided and non-empty, pass it to `createProjectImage` as `sourceId`.
- If `sourceId` is absent, pass `null` (backward compatibility).
- All other logic remains unchanged.

---

## 7. Route Registration — `src/server/src/app.ts`

Add the following routes under the existing `transcribeAuthMiddleware` group, alongside the existing image routes:

```
PUT    /api/transcribe/projects/:projectId/image-sources/:sourceId
POST   /api/transcribe/projects/:projectId/image-sources/:sourceId/split
DELETE /api/transcribe/projects/:projectId/image-sources/:sourceId/split
```

---

## 8. API Response Shape Updates

### `GET .../images` and `GET .../images/:imageId` (updated)

Each image object gains the following fields:

```ts
{
  // existing fields unchanged
  sourceId: string | null;
  cropX: number | null; // 0–1 ratio
  side: 'left' | 'right' | null;
  isActive: boolean; // always true (inactive rows filtered server-side)
}
```

Map DB column names to camelCase in the handler response objects, consistent with the existing pattern (e.g. `page_sequence` → `pageSequence`).

---

## 9. Failure Modes & Invariants

| Scenario                                       | Behaviour                                                                                   |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Split transaction partially fails              | Full rollback; `page_count` stays `1`; no derived rows created                              |
| Revert called on non-split source              | `409` — no DB mutation                                                                      |
| `cropX = 0.5` exactly                          | Accepted (within `0.1–0.9` range)                                                           |
| `cropX < 0.1` or `> 0.9`                       | `400` — degenerate split rejected by Zod schema                                             |
| Re-split after revert                          | Soft-deleted rows remain in DB; new split creates new rows with new IDs                     |
| Delete source while split                      | `ON DELETE CASCADE` on `source_id` FK removes derived rows                                  |
| Existing `project_images` rows (pre-migration) | `source_id = null`, `is_active = NULL`; included by `IS NULL` guard in `get-project-images` |

---

## 10. Agentic Verification

```bash
# Type & lint — all new backend files
./scripts/opencode-check.sh src/server/src/database/create-image-source.ts
./scripts/opencode-check.sh src/server/src/database/find-image-source.ts
./scripts/opencode-check.sh src/server/src/database/create-derived-pages.ts
./scripts/opencode-check.sh src/server/src/database/revert-split.ts
./scripts/opencode-check.sh src/server/src/handlers/handle-image-source-put.ts
./scripts/opencode-check.sh src/server/src/handlers/handle-spread-split-post.ts
./scripts/opencode-check.sh src/server/src/handlers/handle-spread-revert-delete.ts

# Backend tests
cd src/server && yarn test src/database/create-image-source.test.ts
cd src/server && yarn test src/database/find-image-source.test.ts
cd src/server && yarn test src/database/create-derived-pages.test.ts
cd src/server && yarn test src/database/revert-split.test.ts
cd src/server && yarn test src/handlers/handle-image-source-put.test.ts
cd src/server && yarn test src/handlers/handle-spread-split-post.test.ts
cd src/server && yarn test src/handlers/handle-spread-revert-delete.test.ts

# ESM validation
/verify-esm src/server/src/database/create-image-source.ts
/verify-esm src/server/src/database/create-derived-pages.ts
/verify-esm src/server/src/handlers/handle-spread-split-post.ts
/verify-esm src/server/src/handlers/handle-spread-revert-delete.ts
```
