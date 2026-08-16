---
description: Add split-spread action to Assets tab image cards; implement draggable-divider preview modal; wire split/revert to new API endpoints.
status: draft
targets:
  - src/app/transcribe/api/split-spread.ts
  - src/app/transcribe/api/split-spread.test.ts
  - src/app/transcribe/api/revert-split.ts
  - src/app/transcribe/api/revert-split.test.ts
  - src/app/transcribe/api/save-image-source.ts
  - src/app/transcribe/api/save-image-source.test.ts
  - src/app/transcribe/schemata.ts
  - src/app/transcribe/project/types.ts
  - src/app/transcribe/project/_components/assets-tab.tsx
  - src/app/transcribe/project/_components/assets-tab.test.tsx
  - src/app/transcribe/project/_components/spread-split-modal.tsx
  - src/app/transcribe/project/_components/spread-split-modal.module.css
  - src/app/transcribe/project/_components/spread-split-modal.test.tsx
  - src/app/transcribe/project/_hooks/use-asset-manager.ts
  - src/app/transcribe/project/_hooks/use-asset-manager.test.ts
context:
  - src/server/specs/005-spread-split-backend.md
  - src/app/transcribe/project/_components/assets-tab.tsx
  - src/app/transcribe/project/_hooks/use-asset-manager.ts
  - src/app/transcribe/project/types.ts
  - src/app/transcribe/schemata.ts
  - src/app/transcribe/api/save-project-image.ts
  - src/app/transcribe/api/request.ts
  - CONVENTIONS.md
---

# Spread Split — Frontend: Assets Tab Split Action & Modal

## 1. Architectural Boundary

- **Execution Context:** Client (Next.js & React 19) — `'use client'` components
- **Data Scope:** Local State → HTTP JSON (new split/revert API service functions)

---

## 2. State Transition Matrix

### Current State

- `AssetsTab` displays uploaded image cards with only "Include / Remove" controls.
- There is no way to mark an image as a spread or split it.
- `useAssetManager` manages upload state only; it has no concept of source IDs or split state.
- `ImageFile` in `types.ts` has no `sourceId`, `isSplit`, or `splitCropX` fields.

### Target State

- Each image card in the Assets tab shows a **"Розділити розворот"** button only after upload succeeds (`status === 'success'`).
- Clicking "Розділити розворот" opens a **`SpreadSplitModal`** with a draggable vertical divider over the image preview.
- Confirming the split calls `POST .../image-sources/:sourceId/split`.
- A successfully split card shows a **"Скасувати розділення"** button and a visual two-panel indicator instead of "Розділити розворот".
- Clicking "Скасувати розділення" calls `DELETE .../image-sources/:sourceId/split` after a `window.confirm` prompt.
- All split/revert actions show `sonner` toasts on success and failure.

```ts
// Target: extended ImageFile type (src/app/transcribe/project/types.ts)
interface ImageFile {
  // existing fields unchanged
  sourceId: string; // set after successful upload; equals image.id by construction
  isSplit: boolean; // true after confirmed split, false after revert
  splitCropX: number | null; // the confirmed cropX ratio; null if not split
}
```

---

## 3. Zod Schema Updates — `src/app/transcribe/schemata.ts`

Add the following schemas to the existing file:

```ts
export const projectImageSourceResponseSchema = z.object({
  success: z.boolean(),
  sourceId: z.string(),
  pageId: z.string(),
  url: z.string(),
});
export type ProjectImageSourceResponse = z.infer<
  typeof projectImageSourceResponseSchema
>;

export const spreadSplitResponseSchema = z.object({
  success: z.boolean(),
  sourceId: z.string(),
  leftPageId: z.string(),
  rightPageId: z.string(),
});
export type SpreadSplitResponse = z.infer<typeof spreadSplitResponseSchema>;
```

Also extend the existing `projectImageSchema` with three new optional fields:

```ts
sourceId: z.string().nullable().optional(),
cropX: z.number().nullable().optional(),
side: z.enum(['left', 'right']).nullable().optional(),
```

The inferred `ProjectImage` type gains these fields automatically.

---

## 4. New API Service Functions

### 4.1. `src/app/transcribe/api/save-image-source.ts` _(new file)_

Replaces the role of `save-project-image.ts` for the initial upload step when the new source-based flow is used.

```ts
export default async function saveImageSource(
  projectId: string,
  sourceId: string,
  pageId: string,
  file: File,
  pageSequence: number,
  signal?: AbortSignal,
): Promise<ProjectImageSourceResponse>;
```

- Compute `blurhash` client-side via the existing `calculateBlurhash` helper before building the request.
- Build a `FormData` with fields: `file`, `blurhash`, `pageSequence` (as string), `pageId`.
- `PUT /api/transcribe/projects/${projectId}/image-sources/${sourceId}`.
- Parse the response JSON as `unknown`, then validate with `projectImageSourceResponseSchema`.
- Return the parsed value.
- Let errors propagate — the caller handles them.

### 4.2. `src/app/transcribe/api/split-spread.ts` _(new file)_

```ts
export default async function splitSpread(
  projectId: string,
  sourceId: string,
  payload: {
    cropX: number;
    leftPageId: string;
    rightPageId: string;
    leftPageSequence: number;
    rightPageSequence: number;
    leftPageName?: string | null;
    rightPageName?: string | null;
  },
  signal?: AbortSignal,
): Promise<SpreadSplitResponse>;
```

- `POST /api/transcribe/projects/${projectId}/image-sources/${sourceId}/split`.
- Body: `JSON.stringify({ sourceId, ...payload })`, `Content-Type: application/json`.
- Parse response with `spreadSplitResponseSchema`.
- Let errors propagate.

### 4.3. `src/app/transcribe/api/revert-split.ts` _(new file)_

```ts
export default async function revertSplit(
  projectId: string,
  sourceId: string,
  signal?: AbortSignal,
): Promise<{ success: boolean }>;
```

- `DELETE /api/transcribe/projects/${projectId}/image-sources/${sourceId}/split`.
- Parse response with `z.object({ success: z.boolean() })`.
- Let errors propagate.

---

## 5. `SpreadSplitModal` Component

**File:** `src/app/transcribe/project/_components/spread-split-modal.tsx`
**Directive:** `'use client'`

### 5.1. Props interface

```ts
interface SpreadSplitModalProperties {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  onConfirm: (cropX: number) => void; // cropX: 0–1 ratio
  onCancel: () => void;
}
```

### 5.2. Internal state

```ts
const [cropX, setCropX] = useState<number>(0.5);
const [isDragging, setIsDragging] = useState<boolean>(false);
```

### 5.3. Layout structure

- A native `<dialog>` element with `aria-modal="true"` and `aria-labelledby` pointing to the heading's `id`.
- A heading: `"Розділити розворот"`.
- A **preview container** (`position: relative`, `overflow: hidden`) displaying the image via `<Image />` from `next/image`. The container has a fixed max-width and preserves the image's aspect ratio.
- A **draggable divider**: a `<div>` with `position: absolute`, `left: ${cropX * 100}%`, full height of the container. Styled with a visible contrasting colour (e.g. a 2px solid line with a circular drag handle at the vertical midpoint).
- Two **half-labels** floating over the left and right panels: `"Сторінка 1"` (left) and `"Сторінка 2"` (right), positioned absolutely with `pointer-events: none`.
- A footer row with a **"Підтвердити"** `<button type="button">` and a **"Скасувати"** `<button type="button">`.

### 5.4. Drag interaction

Use the Pointer Events API for cross-device compatibility (mouse and touch).

- `onPointerDown` on the divider element:
  1. `event.preventDefault()`.
  2. `dividerElement.setPointerCapture(event.pointerId)`.
  3. `setIsDragging(true)`.
- `onPointerMove` on the divider element (fires while pointer is captured):
  1. Compute `newCropX = (event.clientX - containerRect.left) / containerRect.width`.
  2. Clamp: `newCropX = Math.max(0.1, Math.min(0.9, newCropX))`.
  3. `setCropX(newCropX)`.
- `onPointerUp` and `onPointerCancel` on the divider element:
  1. `setIsDragging(false)`.

Obtain `containerRect` via a `useRef` on the preview container element, reading `getBoundingClientRect()` inside the pointer move handler.

### 5.5. Confirm and cancel

- **Confirm button**: calls `onConfirm(cropX)`. The parent is responsible for the API call and toast.
- **Cancel button**: calls `onCancel()`.
- **Escape key**: add a `keydown` listener on the dialog; call `onCancel()` on `Escape`.

### 5.6. Accessibility requirements

- `<dialog>` must have `open` attribute controlled by the parent (rendered conditionally, not via `showModal()`).
- Divider must have `role="separator"` and `aria-label="Лінія розділення"`.
- Confirm and Cancel buttons must have explicit `type="button"` and descriptive `aria-label` if icon-only.
- Focus must move to the dialog heading or the first interactive element on open. Use `autoFocus` on the Confirm button or manage focus via `useEffect`.
- Tab key must not escape the dialog while it is open (focus trap). Implement a minimal focus trap: on `keydown Tab`, if focus is on the last focusable element, redirect to the first, and vice versa.

### 5.7. CSS module — `spread-split-modal.module.css`

Provide styles for:

- `overlay`: full-viewport semi-transparent backdrop (`position: fixed`, `inset: 0`, `background: rgba(0,0,0,0.5)`).
- `dialog`: centred card with `position: fixed`, `top: 50%`, `left: 50%`, `transform: translate(-50%, -50%)`.
- `previewContainer`: `position: relative`, `overflow: hidden`, `user-select: none`.
- `divider`: `position: absolute`, `top: 0`, `bottom: 0`, `width: 2px`, `cursor: col-resize`, `touch-action: none`.
- `dividerHandle`: circular handle centred on the divider line.
- `halfLabel`: `position: absolute`, `top: 8px`, `pointer-events: none`, `font-size: 0.75rem`.
- `footer`: flex row, `justify-content: flex-end`, `gap: 8px`.
- Both light and dark mode variants via `@media (prefers-color-scheme: dark)` or CSS variables consistent with the project's existing theme.

---

## 6. `useAssetManager` Hook Updates

### 6.1. `ImageFile` type — `src/app/transcribe/project/types.ts`

Add to the existing `ImageFile` interface:

```ts
sourceId: string; // equals id by construction; used as sourceId in API calls
isSplit: boolean;
splitCropX: number | null;
```

### 6.2. `handleFileSelect` — initialise new fields

When constructing new `ImageFile` entries in `handleFileSelect`, add:

```ts
sourceId: crypto.randomUUID(),  // generated once per file; used as both sourceId and the upload key
isSplit: false,
splitCropX: null,
```

Note: `image.id` continues to be used as the `imageId` in the legacy `saveProjectImage` path. For the new `saveImageSource` path, `image.sourceId` is the source identifier and a separate `pageId` is generated at upload time (see §6.3).

### 6.3. `startUpload` — use `saveImageSource`

Replace the `saveProjectImage` call with `saveImageSource`:

```ts
await saveImageSource(
  projectId,
  image.sourceId, // sourceId
  crypto.randomUUID(), // pageId — fresh UUID per upload
  image.file,
  index + 1,
  signal,
);
```

All abort/error/status handling logic remains identical to the current implementation.

### 6.4. New `handleSplitConfirm(imageId: string, cropX: number): Promise<void>`

```
1. Find the ImageFile by id; return early if not found.
2. Generate leftPageId = crypto.randomUUID(), rightPageId = crypto.randomUUID().
3. Determine page sequences:
     leftPageSequence  = index of this image in the images array + 1  (1-based)
     rightPageSequence = leftPageSequence + 1
4. Call splitSpread(projectId, image.sourceId, {
     cropX,
     leftPageId,
     rightPageId,
     leftPageSequence,
     rightPageSequence,
   }).
5. On success:
     setImages(prev => prev.map(img =>
       img.id === imageId
         ? { ...img, isSplit: true, splitCropX: cropX }
         : img
     ))
     toast.success('Розворот розділено')
6. On error:
     toast.error('Не вдалося розділити розворот')
```

### 6.5. New `handleRevertSplit(imageId: string): Promise<void>`

```
1. Show window.confirm('Скасувати розділення цього розвороту?'); return if cancelled.
2. Find the ImageFile by id; return early if not found.
3. Call revertSplit(projectId, image.sourceId).
4. On success:
     setImages(prev => prev.map(img =>
       img.id === imageId
         ? { ...img, isSplit: false, splitCropX: null }
         : img
     ))
     toast.success('Розділення скасовано')
5. On error:
     toast.error('Не вдалося скасувати розділення')
```

### 6.6. Return value additions

Add `handleSplitConfirm` and `handleRevertSplit` to the hook's return object.

---

## 7. `AssetsTab` Component Updates

### 7.1. New props

Add to `AssetsTabProperties` (in `types.ts`):

```ts
onSplitConfirm: (imageId: string, cropX: number) => Promise<void>;
onRevertSplit: (imageId: string) => Promise<void>;
```

### 7.2. Modal state (local to `AssetsTab`)

```ts
const [splitModalImageId, setSplitModalImageId] = useState<string | null>(null);
```

- `openSplitModal(id: string)` → `setSplitModalImageId(id)`.
- `closeSplitModal()` → `setSplitModalImageId(null)`.

### 7.3. Per-card split controls

After the existing Remove/Include button, render the following when `image.status === 'success'` and `!isUploading` and `!isSuccess`:

```tsx
{
  !image.isSplit ? (
    <button
      type="button"
      className={styles.ctaButton}
      onClick={() => openSplitModal(image.id)}
      aria-label="Розділити розворот"
    >
      Розділити розворот
    </button>
  ) : (
    <div className={styles.splitIndicator}>
      <span aria-hidden="true">⊟</span>
      <span>Розворот розділено</span>
      <button
        type="button"
        className={clsx(styles.ctaButton, styles.btnDanger)}
        onClick={() => {
          void onRevertSplit(image.id);
        }}
        aria-label="Скасувати розділення"
      >
        Скасувати розділення
      </button>
    </div>
  );
}
```

### 7.4. Modal rendering

Below the image grid, render conditionally:

```tsx
{
  splitModalImageId !== null &&
    (() => {
      const modalImage = images.find((img) => img.id === splitModalImageId);
      if (!modalImage) return null;
      return (
        <SpreadSplitModal
          imageUrl={modalImage.previewUrl}
          imageWidth={/* use natural dimensions if available, else a safe default */}
          imageHeight={/* same */}
          onConfirm={(cropX) => {
            void onSplitConfirm(splitModalImageId, cropX);
            closeSplitModal();
          }}
          onCancel={closeSplitModal}
        />
      );
    })();
}
```

### 7.5. Disabled states

- "Розділити розворот" button is not rendered while `isUploading` or `isSuccess`.
- "Скасувати розділення" button is not rendered while `isUploading` or `isSuccess`.

---

## 8. Failure Modes & Edge Cases

| Scenario                                 | Behaviour                                                                                          |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------- |
| User drags divider to `< 0.1` or `> 0.9` | `clamp` in pointer handler prevents it; Confirm button remains enabled                             |
| Split API returns `409` (already split)  | `toast.error`; `isSplit` stays `false` (UI was out of sync — refresh resolves)                     |
| Revert API returns `409` (not split)     | `toast.error`; `isSplit` stays `true`                                                              |
| User closes modal without confirming     | `onCancel` called; no API call; state unchanged                                                    |
| Upload is cancelled mid-stream           | Images with `status !== 'success'` never show split controls                                       |
| Image has no `url` yet (upload pending)  | Split button not rendered (guarded by `status === 'success'`)                                      |
| `saveImageSource` fails for one image    | Existing error handling in `startUpload` marks that image `status: 'error'`; other images continue |

---

## 9. Agentic Verification

```bash
# Type & lint
./scripts/opencode-check.sh src/app/transcribe/api/save-image-source.ts
./scripts/opencode-check.sh src/app/transcribe/api/split-spread.ts
./scripts/opencode-check.sh src/app/transcribe/api/revert-split.ts
./scripts/opencode-check.sh src/app/transcribe/project/_components/spread-split-modal.tsx
./scripts/opencode-check.sh src/app/transcribe/project/_components/assets-tab.tsx
./scripts/opencode-check.sh src/app/transcribe/project/_hooks/use-asset-manager.ts

# Frontend tests
yarn test src/app/transcribe/api/save-image-source.test.ts
yarn test src/app/transcribe/api/split-spread.test.ts
yarn test src/app/transcribe/api/revert-split.test.ts
yarn test src/app/transcribe/project/_components/spread-split-modal.test.tsx
yarn test src/app/transcribe/project/_components/assets-tab.test.tsx
yarn test src/app/transcribe/project/_hooks/use-asset-manager.test.ts
```
