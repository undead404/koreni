---
description: Apply virtual crop in the workspace ImageViewer for split-page project_images rows; add split-spread action to the workspace toolbar.
status: draft
targets:
  - src/app/transcribe/workspace/_components/image-viewer.tsx
  - src/app/transcribe/workspace/_components/image-viewer.test.tsx
  - src/app/transcribe/workspace/_hooks/use-project-images.ts
  - src/app/transcribe/workspace/_hooks/use-project-images.test.ts
  - src/app/transcribe/workspace/page.tsx
  - src/app/transcribe/workspace/page.test.tsx
  - src/app/transcribe/schemata.ts
context:
  - specs/075-spread-split-assets-tab.md
  - src/server/specs/005-spread-split-backend.md
  - src/app/transcribe/workspace/_components/image-viewer.tsx
  - src/app/transcribe/workspace/_hooks/use-project-images.ts
  - src/app/transcribe/workspace/_hooks/use-image-transform.ts
  - src/app/transcribe/workspace/page.tsx
  - src/app/transcribe/schemata.ts
  - src/app/transcribe/api/split-spread.ts
  - src/app/transcribe/api/get-project-images.ts
  - CONVENTIONS.md
---

# Spread Split — Frontend: Workspace Virtual-Crop Viewer & Toolbar Action

## 1. Architectural Boundary

- **Execution Context:** Client (Next.js & React 19) — `'use client'` components
- **Data Scope:** Local State — reads `cropX` and `side` from the `ProjectImage` shape returned by `getProjectImages`; calls `splitSpread` on confirm

---

## 2. State Transition Matrix

### Current State

- `ImageViewer` renders the full image for every `project_images` row regardless of whether it is a derived split page.
- `ProjectImage` type has no `cropX`, `side`, or `sourceId` fields.
- The workspace has no split action.

### Target State

- When `currentImage.side` is `'left'` or `'right'`, `ImageViewer` applies a CSS clip to show only the relevant half of the image, using `currentImage.cropX` as the boundary ratio.
- The pan/zoom transform (`useImageTransform`) continues to operate on the visible (cropped) region without modification.
- A **"Розділити розворот"** toolbar button appears in the workspace right panel when the current image is an unsplit single page (`side === null` and `cropX === null` and `sourceId !== null`).
- Clicking the button opens `SpreadSplitModal` (imported from `src/app/transcribe/project/_components/spread-split-modal.tsx`).
- After confirming a split, the image list is re-fetched and the viewer navigates to the left-page result.

```ts
// ProjectImage type gains (already added in spec 075 via schemata.ts):
sourceId: string | null;
cropX: number | null; // 0–1 ratio
side: 'left' | 'right' | null;
```

---

## 3. Virtual Crop Implementation — `ImageViewer`

### 3.1. Crop descriptor inputs

`ImageViewer` already receives the full `images` array and `currentImageIndex`. It reads from `images[currentImageIndex]`:

- `cropX: number | null` — the split ratio.
- `side: 'left' | 'right' | null` — which half to show.

Add these two fields to the `ImageViewerProperties` interface:

```ts
cropX: number | null;
side: 'left' | 'right' | null;
```

The workspace `page.tsx` passes `currentImage.cropX` and `currentImage.side` directly.

### 3.2. CSS clip strategy

When `side` is non-null, the image is rendered at its **full natural width** inside a clipping container that hides the unwanted half via `overflow: hidden`.

```
┌──────────────────────────────────────┐  ← clipping container (overflow: hidden)
│  [visible half]  │  [hidden half]    │    width = cropX * 100%  (left)
│                  │                   │       OR (1 - cropX) * 100%  (right)
└──────────────────────────────────────┘
```

**Left page (`side === 'left'`):**

- Clipping container: `width = cropX * 100%` of the image's natural pixel width; `overflow: hidden`.
- Image element: `position: absolute; left: 0; top: 0`.

**Right page (`side === 'right'`):**

- Clipping container: `width = (1 - cropX) * 100%` of the image's natural pixel width; `overflow: hidden`.
- Image element: `position: absolute; left: -(cropX * 100%); top: 0`.

Both cases use `position: relative` on the clipping container and `position: absolute` on the image element. The clipping container is itself placed inside the existing viewer wrapper that `useImageTransform` targets.

### 3.3. Zoom and pan with virtual crop

- `useImageTransform` applies `transform: translate(x, y) scale(s)` to the image element.
- The clipping container is the element referenced by `viewerReference` — the transform is applied inside it.
- Because the container clips via `overflow: hidden`, the user cannot pan to reveal the hidden half.
- **No changes to `useImageTransform` are required.**

### 3.4. Non-split images

When `side === null`, the component renders exactly as today: no clipping container, no offset. The `cropX` value is ignored. The existing layout and CSS are unchanged for this case.

### 3.5. Dimension source

Use `currentImage.width` and `currentImage.height` (already present on `ProjectImage`) to compute the clipping container's pixel dimensions. If either is null (legacy rows), fall back to rendering the full image without clipping.

---

## 4. Workspace Toolbar Split Action

### 4.1. Condition for showing the button

Render the "Розділити розворот" button in the workspace right panel when **all** of the following are true:

- `currentImage.side === null`
- `currentImage.cropX === null`
- `currentImage.sourceId !== null` (legacy rows without a source cannot be split from the workspace)

The button is **not** shown when the current image is already a derived split page (`side` is `'left'` or `'right'`).

### 4.2. Button placement in `page.tsx`

Inside the `rightPanel` div, add below `<PageNameForm>` and above `<TranscriptionTable>`:

```tsx
{
  currentImage.side === null &&
    currentImage.cropX === null &&
    currentImage.sourceId !== null && (
      <button
        type="button"
        onClick={() => setIsWorkspaceSplitModalOpen(true)}
        aria-label="Розділити розворот"
      >
        Розділити розворот
      </button>
    );
}
```

### 4.3. Modal reuse

Import `SpreadSplitModal` directly from `src/app/transcribe/project/_components/spread-split-modal.tsx`. No duplication of the component.

### 4.4. Post-confirm flow in `page.tsx`

When the user confirms a split from the workspace modal:

```
1. Call splitSpread(projectId, currentImage.sourceId, {
     cropX,
     leftPageId:        crypto.randomUUID(),
     rightPageId:       crypto.randomUUID(),
     leftPageSequence:  currentImage.pageSequence,
     rightPageSequence: currentImage.pageSequence + 1,
   }).
2. On success:
   a. toast.success('Розворот розділено')
   b. Call refetchImages() from useProjectImages.
   c. After refetch resolves, find the index of the left-page result in the new images array
      by matching leftPageId.
   d. setCurrentImageIndex(leftPageIndex ?? 0).
   e. handleResetTransform().
3. On error:
   a. toast.error('Не вдалося розділити розворот')
4. setIsWorkspaceSplitModalOpen(false) in both success and error paths (finally).
```

### 4.5. New local state in `page.tsx`

```ts
const [isWorkspaceSplitModalOpen, setIsWorkspaceSplitModalOpen] =
  useState<boolean>(false);
```

Render the modal conditionally:

```tsx
{
  isWorkspaceSplitModalOpen && currentImage && (
    <SpreadSplitModal
      imageUrl={currentImage.url}
      imageWidth={currentImage.width ?? 800}
      imageHeight={currentImage.height ?? 600}
      onConfirm={(cropX) => {
        void handleWorkspaceSplitConfirm(cropX);
      }}
      onCancel={() => setIsWorkspaceSplitModalOpen(false)}
    />
  );
}
```

Extract the confirm logic into a named async function `handleWorkspaceSplitConfirm(cropX: number): Promise<void>` to keep JSX clean and satisfy the 300-line file limit convention.

---

## 5. `useProjectImages` Hook Updates

### 5.1. New `refetchImages` function

Expose a `refetchImages(): Promise<void>` from the hook's return value. This is called by the workspace split confirm flow.

```ts
const refetchImages = useCallback(async () => {
  if (!projectId) return;
  const abortController = new AbortController();
  try {
    const imagesData = await getProjectImages(
      projectId,
      undefined,
      abortController.signal,
    );
    setImages(imagesData);
  } catch {
    // Silent failure — the workspace remains on the current image
  }
}, [projectId]);
```

Add `refetchImages` to the hook's return object.

### 5.2. No other changes

The hook's existing fetch-on-mount, abort controller, error handling, and `localStorage` index persistence logic are unchanged.

---

## 6. `schemata.ts` — no additional changes

`projectImageSchema` already gains `sourceId`, `cropX`, and `side` in spec 075. This spec depends on those fields being present. No further schema changes are needed here.

---

## 7. Failure Modes & Edge Cases

| Scenario                                                             | Behaviour                                                                                    |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `currentImage.cropX` is `null` but `side` is non-null (corrupt data) | Treat as non-split: render full image, hide split button                                     |
| `cropX = 0.5` exactly                                                | Left container = 50% width; right image offset = -50% — renders correctly                    |
| User zooms in on a cropped page                                      | Zoom applies inside the clipping container; hidden half stays hidden                         |
| User pans beyond the visible crop boundary                           | `overflow: hidden` on the clipping container prevents revealing the hidden half              |
| Split API fails from workspace                                       | `toast.error`; `images` state unchanged; user remains on the current image                   |
| Re-fetch after split returns empty list                              | Existing redirect to `/transcribe/project/?projectId=...` in `useProjectImages` handles this |
| `sourceId` is null on current image (legacy row)                     | Split button is hidden (guarded by `currentImage.sourceId !== null`)                         |
| Image list re-fetch races with component unmount                     | `AbortController` in `refetchImages` cancels the stale request                               |
| `currentImage.width` or `currentImage.height` is null                | Fall back to rendering the full image without clipping (no crash)                            |
| `leftPageId` not found in re-fetched list                            | `setCurrentImageIndex(0)` as fallback                                                        |

---

## 8. Invariants

1. The clipping container's dimensions are always computed from `cropX` and the image's `width`/`height` from the DB — never from the viewport or rendered element size.
2. `useImageTransform` state is reset (`handleResetTransform`) whenever `currentImageIndex` changes, including after a split re-fetch navigates to the left page.
3. `SpreadSplitModal` is never rendered simultaneously from both the Assets tab and the workspace — they are on separate routes.
4. The workspace never calls `revertSplit` — revert is only available from the Assets tab (spec 075).
5. `handleWorkspaceSplitConfirm` always closes the modal in its `finally` block, regardless of API outcome.

---

## 9. Agentic Verification

```bash
# Type & lint
./scripts/opencode-check.sh src/app/transcribe/workspace/_components/image-viewer.tsx
./scripts/opencode-check.sh src/app/transcribe/workspace/_hooks/use-project-images.ts
./scripts/opencode-check.sh src/app/transcribe/workspace/page.tsx

# Frontend tests
yarn test src/app/transcribe/workspace/_components/image-viewer.test.tsx
yarn test src/app/transcribe/workspace/_hooks/use-project-images.test.ts
yarn test src/app/transcribe/workspace/page.test.tsx
```
