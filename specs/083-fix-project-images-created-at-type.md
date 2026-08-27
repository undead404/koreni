---
description: Fix Zod validation failure when fetching project images due to createdAt type mismatch where integer/number was expected but string was defined.
targets:
  - src/app/transcribe/schemata.ts
context:
  - src/app/transcribe/api/get-project-images.ts
  - src/server/specs/004-project-image-table.md
---

# Fix Project Images Created At Type

## 1. Context & Scope

When requesting project images on the transcription pages (e.g., `/transcribe/transcribe/?projectId=[projectId]`), the application makes an API request to `GET /api/transcribe/project/[projectId]/images`. The response contains a list of project images.

On the frontend, this response is validated using `projectImagesResponseSchema` which utilizes `projectImageSchema` defined in `src/app/transcribe/schemata.ts`.
Currently, `projectImageSchema` expects the `createdAt` field to be a `string`. However, the SQLite database schema (`project_images` table defined in `src/server/specs/004-project-image-table.md`) stores the `created_at` column as an `integer` representing a Unix timestamp (epoch seconds). As a result, the API returns a number for `createdAt`. This type mismatch causes Zod to throw a validation error:

```plain
Failed to fetch project images: ZodError: [
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "images",
      0,
      "createdAt"
    ],
    "message": "Invalid input: expected string, received number"
  }
]
```

This specification details the necessary frontend schema fix to match the database column type.

---

## 2. Current Behavior vs. Target State

### Current Behavior

- `projectImageSchema` defines `createdAt` as:

  ```ts
  createdAt: z.string().nullable().optional(),
  ```

- The backend returns an integer/number for `createdAt` (e.g., `123456789`).
- Parsing responses with `projectImagesResponseSchema.parse(data)` throws a `ZodError` and fails the page load.

### Target Behavior

- `projectImageSchema` defines `createdAt` as:

  ```ts
  createdAt: z.number().nullable().optional(),
  ```

- Parsing responds successfully, allowing transcription page rendering to function without error.

---

## 3. Detailed Specifications

### 3.1. Schema Adjustment (`src/app/transcribe/schemata.ts`)

Modify the `createdAt` property within the `projectImageSchema` object to be a number:

```ts
export const projectImageSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  storageKey: z.string(),
  pageSequence: z.number(),
  pageName: z.string().nullable().optional(),
  height: z.number().nullable().optional(),
  width: z.number().nullable().optional(),
  createdAt: z.number().nullable().optional(), // Updated from z.string() to z.number()
  blurhash: z.string().nullable().optional(),
});
```

---

## 4. Constraints & Technical Requirements

- Follow **Zone A** frontend constraints for `src/app/transcribe/schemata.ts`.
- Ensure type definitions (`ProjectImage` exported from `schemata.ts`) update cleanly.
- Do not introduce any breaking changes to other fields or files.

---

## 5. Testing Directives

### 5.1. Verification

Run the transcription page tests to verify that Mocking and API fetching works cleanly without schema validation errors:

```bash
yarn test
```

Or specifically:

```bash
yarn exec vitest src/app/transcribe/transcribe/page.test.tsx src/app/transcribe/project/page.test.tsx
```

Ensure that there are no TypeScript errors:

```bash
yarn exec tsc --noEmit
```
