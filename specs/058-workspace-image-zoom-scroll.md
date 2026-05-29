---
description: Implement horizontal and vertical zoom and pan capabilities for the workspace Image component.
status: draft
targets:
  - src/app/transcribe/workspace/page.tsx
---

# Workspace Image Zoom and Scroll

## 1. Architectural Boundary

- **Execution Context:** Client (Next.js & React 19)
- **Data Scope:** Local State

---

## 2. State Transition Matrix

### Fault / Current State

- **Condition:** The `<Image />` component within the transcribe workspace lacks native zoom and two-dimensional pan capabilities.
- **Behavior:** Users cannot visually inspect specific regions of the document by zooming in and scrolling across the image with their mouse.
- **Log/Trace:**

```ts
// Currently lacks responsive scale and translation state mechanics
const WorkspaceImage = () => {
  return <Image src="..." />;
}
```

### Target / Resolved State

- **Condition:** The workspace image view requires robust navigational controls for detailed image analysis.
- **Behavior:** The `<Image />` component dynamically reflects local state for scale, translateX, and translateY. It registers native mouse events for wheel zoom and pointer drag panning in both directions.
- **Schema/Type Alteration:**

```ts
interface TransformState {
  scale: number;
  x: number;
  y: number;
}

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
}
```

---

## 3. Execution Pipeline

### 3.1. src/app/transcribe/workspace/page.tsx

1. **Transform State Management:** Introduce local state variables for `scale`, `translateX`, and `translateY`. Ensure reasonable constraints (e.g., minimum scale > 0.1, maximum scale).
2. **Wheel Zooming:**
   - Add a wheel event handler on the image container.
   - Calculate the delta from `event.deltaY` to increment or decrement the `scale` state.
   - Prevent default scroll behavior while hovering the image block.
3. **Button Zooming:**
   - Integrate UI buttons for explicit Zoom In and Zoom Out operations that update the `scale` state.
4. **Drag Scrolling (Panning):**
   - Bind `onMouseDown` to the image container to initialize dragging state (`isDragging = true`) and record the initial `clientX` / `clientY`.
   - Bind `onMouseMove` to calculate the distance moved since the last point, and update `translateX` and `translateY` states accordingly.
   - Bind `onMouseUp` and `onMouseLeave` to terminate the dragging sequence (`isDragging = false`).
5. **CSS Transformation Rendering:**
   - Enforce `overflow: hidden` on the outer image container boundary.
   - Apply inline styles to the inner container or the Image component: `transform: translate(${translateX}px, ${translateY}px) scale(${scale})`.
   - Update cursor styles (`cursor: grab` natively, `cursor: grabbing` on drag).

---

## 4. Agentic Verification

Execute the following commands to validate the implementation:

1. **Type & Lint Pass:** Run standard formatting and type checks.

```bash
   /lint src/app/transcribe/workspace/page.tsx
```

2. **Targeted Test Execution:**

```bash
   /test-route src/app/transcribe/workspace/page.test.tsx
```
