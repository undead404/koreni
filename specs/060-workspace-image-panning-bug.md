---
description: Fix image panning behavior by preventing default browser drag-and-drop on the viewer image.
status: draft
targets:
  - src/app/transcribe/workspace/page.tsx
context: []
---

# Fix Workspace Image Panning Bug

## 1. Architectural Boundary

- **Execution Context:** Client (Next.js & React 19)
- **Data Scope:** Local State

---

## 2. State Transition Matrix

### Fault / Current State

- **Condition:** The user presses the left mouse button on the workspace image and moves the mouse to pan the view.
- **Behavior:** The browser intercepts the action as a default image drag-and-drop operation. This prevents the custom `onMouseMove` handler from updating the panning state while the button is held. Panning erratically activates only after releasing the button.
- **Log/Trace:**

```tsx
<Image
  src={images[currentImageIndex].url}
  alt="..."
  fill
  className={styles.displayImage}
  priority
  // Missing draggable={false}
/>
```

### Target / Resolved State

- **Condition:** The user presses the left mouse button on the workspace image and moves the mouse.
- **Behavior:** The image pans smoothly and synchronously with the mouse movement while the button is held down. Panning stops immediately when the button is released. Default browser image dragging is disabled.
- **Schema/Type Alteration:**

```tsx
// Image component is rendered with draggable={false}
<Image
  draggable={false}
  // ...other props
/>
```

---

## 3. Execution Pipeline

### 3.1. src/app/transcribe/workspace/page.tsx

1. Locate the `<Image>` component inside the `viewerReference` container in the render tree.
2. Add the `draggable={false}` attribute to the `<Image>` component to disable native HTML drag-and-drop behavior.
3. (Optional but recommended) In `handleMouseDown`, add `event.preventDefault()` or ensure the container's CSS has `user-select: none` to prevent text selection interference during the drag operation.

---

## 4. Agentic Verification

Execute the following commands to validate the implementation:

1. **Type & Lint Pass:** Run standard formatting and type checks.

```bash
   /lint src/app/transcribe/workspace/page.tsx
```
