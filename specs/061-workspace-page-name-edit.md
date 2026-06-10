---
description: Allow editing pageName for an image and disable transcription table when pageName is missing.
status: draft
targets:
  - src/app/transcribe/workspace/page.tsx
context:
  - src/app/transcribe/schemata.ts
---

# Workspace Page Name Edit

## 1. Architectural Boundary

- **Execution Context:** Client (Next.js & React 19)
- **Data Scope:** Local State / Server Mutation

---

## 2. State Transition Matrix

### Fault / Current State

- **Condition:** Users are not required to define a `pageName` prior to transcribing data.
- **Behavior:** The transcription table is always enabled, and there is no UI to explicitly enter or update a `pageName` for the current image.
- **Log/Trace:**

```tsx
// Current table is always interactable
<table className={styles.table}>{/* inputs and buttons are enabled */}</table>
```

### Target / Resolved State

- **Condition:** The current active image does not have a valid `pageName`.
- **Behavior:**
  1. The UI exposes an input field to edit the `pageName` of the current image. The value must start with a digit. The value should be saved to the server upon change/submission.
  2. The transcription table, along with its inputs and action buttons (e.g., "Додати рядок"), must be disabled.
  3. A clear announcement/prompt is displayed explaining that a `pageName` (e.g., "12", "12зв", "12а", "12азв") must be entered. The user is instructed to read it from the image or deduce it.
- **Schema/Type Alteration:**

```tsx
// Table UI logic depends on pageName presence
const hasPageName = Boolean(images[currentImageIndex]?.pageName);
// If !hasPageName, disable inputs and show prompt
```

---

## 3. Execution Pipeline

### 3.1. src/app/transcribe/workspace/page.tsx

1. Add an input field for `pageName` tied to `images[currentImageIndex]`. It could be placed in the navigation controls or above the transcription table. The input must be in a form, alongside a submission button.
2. Implement a persistence mechanism: when the `pageName` is submitted, it must trigger a server PUT request to `/api/transcribe/projects/:projectId/images/:imageId` to update the backend and, on request success, correspondingly update the local `images` array state.
3. Compute whether the current image has a `pageName`.
4. If `pageName` is missing:
   - Disable the "Додати рядок" button.
   - Disable all inputs and delete buttons in the transcription rows.
   - Render an announcement message (e.g., in place of or alongside the empty state) explicitly requiring the user to input the page's name (mentioning formats like "12", "12зв", "12а", "12азв") by reading it from the image or deducing it.
5. If `pageName` is present, the table and buttons should behave normally.

---

## 4. Agentic Verification

Execute the following commands to validate the implementation:

1. **Type & Lint Pass:** Run standard formatting and type checks.

```bash
   /lint src/app/transcribe/workspace/page.tsx
```

```bash
   /test src/app/transcribe/workspace/page.test.tsx
```
