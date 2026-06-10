---
description: Add a navigation link to the transcription workspace allowing users to return to the project metadata page
status: draft
targets:
  - src/app/transcribe/workspace/page.tsx
context:
  - src/app/transcribe/workspace/page.module.css
---

# Workspace to Project Navigation

## 1. Architectural Boundary

- **Execution Context:** Client (Next.js & React 19)
- **Data Scope:** N/A

---

## 2. State Transition Matrix

### Fault / Current State

- **Condition:** User enters the transcription workspace view at `/transcribe/workspace/?projectId=[id]`.
- **Behavior:** The workspace lacks a dedicated UI element to navigate back to the project configuration page (`/transcribe/project/?projectId=[id]`) to edit metadata or modify the image set.
- **Log/Trace:**

```tsx
// Current table header lacks back navigation
<div className={styles.tableHeader}>
  <h2>Транскрипція</h2>
  <button className={styles.addButton} onClick={addRow}>
    <Plus size={16} />
    Додати рядок
  </button>
</div>
```

### Target / Resolved State

- **Condition:** User enters the transcription workspace view.
- **Behavior:** The user is presented with a clear "Back to Project" button/link (e.g., using `lucide-react` `ArrowLeft` icon). Clicking this element redirects to `/transcribe/project/?projectId=[projectId]`.
- **Schema/Type Alteration:**

```tsx
// No schema change; UI alteration only
```

---

## 3. Execution Pipeline

### 3.1. src/app/transcribe/workspace/page.tsx

1. Import `Link` from `next/link` or an appropriate icon like `ArrowLeft` from `lucide-react`.
2. Locate a suitable header region (e.g., above or inside `styles.tableHeader`, or at the top of the workspace layout).
3. Inject the navigation element to route to `/transcribe/project/?projectId=${projectId}`.
4. Ensure the element is only rendered when `projectId` is available in state (though the component handles missing `projectId` by returning early with a loading state).
5. If necessary, apply class names and update `src/app/transcribe/workspace/page.module.css` for consistent spacing and alignment.

---

## 4. Agentic Verification

Execute the following commands to validate the implementation:

1. **Type & Lint Pass:** Run standard formatting and type checks.

```bash
   /lint src/app/transcribe/workspace/page.tsx
```
