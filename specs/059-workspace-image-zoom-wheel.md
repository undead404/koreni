---
description: Fix image zoom on mouse wheel by resolving early return ref attachment issue
status: draft
targets:
  - src/app/transcribe/workspace/page.tsx
context: []
---

# Fix Image Zoom on Mouse Wheel

## 1. Architectural Boundary

- **Execution Context:** Client (Next.js & React 19)
- **Data Scope:** Local State

---

## 2. State Transition Matrix

### Fault / Current State

- **Condition:** The wheel zoom event listener is attached inside a `useEffect` with an empty dependency array (`[]`). However, the component contains an early return `if (!projectId || isLoading)`, causing `viewerReference.current` to be `null` during the initial mount.
- **Behavior:** The `useEffect` runs once on mount, observes a `null` ref, and exits without attaching the `wheel` event listener. When the loading state completes and the image viewer is rendered, the listener is never attached, causing mouse wheel zooming to silently fail.
- **Log/Trace:**

```ts
// Runs on initial mount where viewerReference.current is null due to early return
useEffect(() => {
  const viewer = viewerReference.current;
  if (!viewer) return; // Exits here permanently
  // ...
}, []);
```

### Target / Resolved State

- **Condition:** The component finishes loading and renders the `imageViewer` div.
- **Behavior:** The mouse wheel correctly adjusts the image zoom level. The event listener is attached properly when the element becomes available, preventing default page scroll while zooming.
- **Schema/Type Alteration:**

```ts
// useEffect correctly tracks when the viewer element becomes available
useEffect(() => {
  const viewer = viewerReference.current;
  if (!viewer) return;

  // ... attach listener
}, [isLoading, projectId]); // or using a callback ref
```

---

## 3. Execution Pipeline

### 3.1. src/app/transcribe/workspace/page.tsx

1. Update the dependency array of the wheel zoom `useEffect` to include `isLoading` and `projectId` so it correctly evaluates and attaches the listener _after_ the early returns have passed and the `imageViewer` div is rendered in the DOM.
2. Ensure that the cleanup function correctly removes the event listener to avoid memory leaks when the component unmounts or re-renders.
3. Verify that using the mouse wheel adjusts the `transform.scale` state correctly without causing the entire page to scroll.

---

## 4. Agentic Verification

Execute the following commands to validate the implementation:

1. **Type & Lint Pass:** Run standard formatting and type checks.

```bash
   /lint src/app/transcribe/workspace/page.tsx

```

2. **Targeted Test Execution:** (if applicable UI tests exist)

```bash
   /test src/app/transcribe/workspace/page.tsx
```
