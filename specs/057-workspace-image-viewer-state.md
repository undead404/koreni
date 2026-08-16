---
description: Display current image in workspace and persist selection in browser storage
status: draft
targets:
  - src/app/transcribe/workspace/page.tsx
context: []
---

# Workspace Persistent Image Viewer

## 1. Architectural Boundary

- **Execution Context:** Client (Next.js & React 19)
- **Data Scope:** Local State (Browser LocalStorage)

---

## 2. State Transition Matrix

### Fault / Current State

- **Condition:** User accesses the transcription workspace page.
- **Behavior:** The left panel shows a static placeholder regardless of the loaded project images. There is no state tracking which image is currently selected, nor any persistence across browser sessions.
- **Log/Trace:**

```tsx
<div className={styles.imagePlaceholder}>
  <ImageIcon size={64} className={styles.placeholderIcon} />
  <p className={styles.placeholderText}>Зображення для транскрибування</p>
  <p className={styles.placeholderSubtext}>(Панель перегляду)</p>
</div>
```

### Target / Resolved State

- **Condition:** User views the transcription workspace and multiple project images are loaded.
- **Behavior:** The left panel renders the currently selected image from the `images` array. The index of the current image is tracked in state and mirrored to `localStorage` (scoped by `projectId`). When the session is restarted, the component restores the last viewed image index from storage.
- **Schema/Type Alteration:**

```ts
// Local state for the selected index
const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
```

---

## 3. Execution Pipeline

### 3.1. src/app/transcribe/workspace/page.tsx

1. Introduce `currentImageIndex` state to keep track of the currently displayed image from the `images` array.
2. Implement a `useEffect` hook that runs on mount (when `projectId` is available and images are loaded) to read the stored index from `localStorage` using a project-specific key (e.g., `koreni_workspace_${projectId}_image_index`). Ensure it defaults to `0` and handles out-of-bounds cases.
3. Implement a `useEffect` hook that writes the `currentImageIndex` to `localStorage` whenever it changes, ensuring the value is persisted for the next session.
4. Replace the static `.imagePlaceholder` in the left panel with an Next.js `<Image>` using the `url` from `images[currentImageIndex]`.
5. Update the `.imageInfo` span in `.viewerHeader` to display the metadata (e.g., `storageKey`) of the currently selected image, rather than always showing the first one (`images[0]`).
6. Add Previous/Next navigation controls in the UI to allow changing the `currentImageIndex`, with boundary checks (min 0, max `images.length - 1`).

---

## 4. Agentic Verification

Execute the following commands to validate the implementation:

1. **Type & Lint Pass:** Run standard formatting and type checks.

```bash
   /lint src/app/transcribe/workspace/page.tsx
```

2. **Targeted Test Execution:** Run the specific route test or overall app test to ensure no regression.

```bash
   /test src/app/transcribe/workspace/page.tsx
```
