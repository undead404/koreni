---
description: Fix pageName update in workspace returning validation error by implementing a proper PATCH endpoint
status: draft
targets:
  - src/app/transcribe/workspace/page.tsx
  - src/server/src/app.ts
  - src/server/src/handlers/handle-project-image-patch.ts
context:
  - src/server/src/handlers/handle-project-image-put.ts
  - src/server/src/database/create-project.ts
---

# Fix Page Name Update Validation Error

## 1. Architectural Boundary

- **Execution Context:** Shared (Server Hono & Client Next.js)
- **Data Scope:** SQLite (Kysely)

---

## 2. State Transition Matrix

### Fault / Current State

- **Condition:** User tries to save a page name for an image in the workspace (`src/app/transcribe/workspace/page.tsx`).
- **Behavior:** The frontend sends a `PUT` request with `application/json` body containing `{ "pageName": "..." }`. The server's `PUT` endpoint (`handleProjectImagePut.ts`) expects a `multipart/form-data` payload for a full image upload with required `file`, `pageSequence`, and `blurhash` fields, leading to a Zod validation error.
- **Log/Trace:**

```json
{
  "error": "Invalid fields: [\n  {\n    \"expected\": \"number\",\n    \"code\": \"invalid_type\",\n    \"received\": \"NaN\",\n    \"path\": [\n      \"pageSequence\"\n    ],\n    \"message\": \"Invalid input: expected number, received NaN\"\n  },\n  {\n    \"expected\": \"string\",\n    \"code\": \"invalid_type\",\n    \"path\": [\n      \"blurhash\"\n    ],\n    \"message\": \"Invalid input: expected string, received undefined\"\n  }\n]"
}
```

### Target / Resolved State

- **Condition:** User attempts to update the page name of an existing image.
- **Behavior:** The frontend sends a `PATCH` request to a dedicated endpoint handling partial image updates via JSON. The backend validates the `pageName` and updates the existing database record.
- **Schema/Type Alteration:**

```ts
// Expected JSON payload for PATCH request
const patchImageSchema = z.object({
  pageName: z.string().nullable().optional(),
});
```

---

## 3. Execution Pipeline

### 3.1. src/server/src/handlers/handle-project-image-patch.ts

1. Create a new handler to process `PATCH` requests.
2. Read the JSON body using `await c.req.json()`.
3. Validate the payload to allow partial updates (e.g., just `pageName`).
4. Execute an `UPDATE` query via Kysely on the `project_images` table for the corresponding `imageId` and `projectId`.
5. The endpoint must return the whole image object, just as `src/server/src/handlers/handle-project-image-get.ts` does.

### 3.2. src/server/src/app.ts

1. Import the newly created `handleProjectImagePatch`.
2. Register the route: `app.patch('/api/transcribe/projects/:projectId/images/:imageId', transcribeAuthMiddleware, handleProjectImagePatch);`.

### 3.3. src/app/transcribe/workspace/page.tsx

1. Change the `fetch` / `requestApi` call for updating the page name from `method: 'PUT'` to `method: 'PATCH'`. Instead of checking for plain success, unlock the transcribing only if the returned image object has a truthy `pageName` field value.

---

## 4. Agentic Verification

Execute the following commands to validate the implementation:

1. **Type & Lint Pass:** Run standard formatting and type checks.

```bash
   /lint src/app/transcribe/workspace/page.tsx
   /lint src/server/src/app.ts
   /lint src/server/src/handlers/handle-project-image-patch.ts
```

2. **Targeted Test Execution:** Validate the server starts successfully and handles the requests.

```bash
   /test-server
```

3. **ESM Validation (Backend Only):**

```bash
   /verify-esm src/server/src/handlers/handle-project-image-patch.ts
```
