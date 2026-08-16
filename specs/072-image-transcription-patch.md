---
description: Add `transcription` field support to project image PATCH route and DB mutation.
status: draft
targets:
  - src/server/src/handlers/handle-project-image-patch.ts
  - src/server/src/database/update-project-image.ts
context:
  - src/server/src/database/client.ts
  - src/server/CONVENTIONS.md
---

# Add Transcription Support to Project Image Patch

## 1. Architectural Boundary

- **Execution Context:** Server (Hono)
- **Data Scope:** SQLite (Kysely)

---

## 2. State Transition Matrix

### Fault / Current State

- **Condition:** Client submits a PATCH request to update the `transcription` of a project image.
- **Behavior:** The `patchImageSchema` in the handler does not accept `transcription`, causing validation to fail or strip the field. Furthermore, the `updateProjectImage` DB layer accepts `transcription` in its parameter type but fails to map it to the `updateData` SQL structure, nor does it return it.
- **Log/Trace:**

```ts
// src/server/src/handlers/handle-project-image-patch.ts
const patchImageSchema = z.object({
  pageName: z.string().nullable().optional(),
  // MISSING: transcription
});

// src/server/src/database/update-project-image.ts
if (data.pageName !== undefined) {
  updateData.page_name = data.pageName;
}
// MISSING: updateData.transcription = data.transcription;
```

### Target / Resolved State

- **Condition:** Valid PATCH request includes a `transcription` string.
- **Behavior:** The handler successfully parses the `transcription` field, the database function maps it to the SQL `UPDATE` object, persists the changes to SQLite, and the updated `transcription` is returned in the API response payload.
- **Schema/Type Alteration:**

```ts
// Expected Zod schema update
const patchImageSchema = z.object({
  pageName: z.string().nullable().optional(),
  transcription: z.string().optional(),
});
```

---

## 3. Execution Pipeline

### 3.1. src/server/src/database/update-project-image.ts

1. Within `updateProjectImage`, map the optional `data.transcription` to the Kysely `updateData` object:

   ```ts
   if (data.transcription !== undefined) {
     updateData.transcription = data.transcription;
   }
   ```

2. Append `'transcription'` to the `.returning([...])` array so that it correctly returns the persisted value.

### 3.2. src/server/src/handlers/handle-project-image-patch.ts

1. Augment `patchImageSchema` to include `transcription: z.string().optional()`.
2. Extract `transcription` from `parsedFields.data` and forward it in the payload object passed to `updateProjectImage(projectId, imageId, { pageName, transcription })`.
3. In the final `c.json(...)` return statement, append `transcription: updatedImage.transcription` to the `image` output response.

---

## 4. Agentic Verification

Execute the following commands to validate the implementation:

1. **Type & Lint Pass:** Run standard formatting and type checks.

```bash
./scripts/opencode-check.sh src/server/src/handlers/handle-project-image-patch.ts
./scripts/opencode-check.sh src/server/src/database/update-project-image.ts
```

2. **ESM Validation (Backend Only):**

```opencode
/verify-esm src/server/src/handlers/handle-project-image-patch.ts
/verify-esm src/server/src/database/update-project-image.ts
```
