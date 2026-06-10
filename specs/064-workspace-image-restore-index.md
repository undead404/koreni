---
description: Fix the last seen project image index restoration issue upon page refresh.
status: draft
targets:
  - src/app/transcribe/workspace/_hooks/use-project-images.ts
context: []
---

# Workspace Image Index Restoration Fix

## 1. Architectural Boundary

- **Execution Context:** Client (Next.js & React 19)
- **Data Scope:** Local State / Local Storage

---

## 2. State Transition Matrix

### Fault / Current State

- **Condition:** Page refresh triggers `useProjectImages` initialization. `projectId` is extracted, triggering the write `useEffect` which saves `currentImageIndex` (initial state `0`) to local storage before images are loaded.
- **Behavior:** The stored image index is overwritten by `0` prematurely, preventing the read `useEffect` from restoring the previously saved index once images are actually loaded and `images.length > 0`.
- **Log/Trace:**

```ts
// src/app/transcribe/workspace/_hooks/use-project-images.ts
// The write effect runs early when projectId becomes valid, overwriting local storage with 0.
useEffect(() => {
  if (!projectId) return;

  const storageKey = `koreni_workspace_${projectId}_image_index`;
  localStorage.setItem(storageKey, currentImageIndex.toString()); // overwrites with 0
}, [projectId, currentImageIndex]);
```

### Target / Resolved State

- **Condition:** Hook initialization correctly orchestrates reading from and writing to local storage.
- **Behavior:** Introduce an initialization flag (`hasRestoredIndex`). The restoration effect attempts to load the index and marks the initialization as complete. The persistence effect waits until `hasRestoredIndex` is true before writing any state back to local storage.
- **Schema/Type Alteration:**

```ts
// Local state alteration within hook
const [hasRestoredIndex, setHasRestoredIndex] = useState<boolean>(false);
```

---

## 3. Execution Pipeline

### 3.1. src/app/transcribe/workspace/\_hooks/use-project-images.ts

1. Introduce a new state variable: `const [hasRestoredIndex, setHasRestoredIndex] = useState(false);`
2. Update the first `useEffect` (persistence read):
   - Check if `hasRestoredIndex` is already true, and if so, return early.
   - At the end of the effect, regardless of whether an index was found or not, set `setHasRestoredIndex(true);`.
   - Update its dependency array to include `hasRestoredIndex`.
3. Update the second `useEffect` (persistence write):
   - Add a check `if (!hasRestoredIndex) return;` at the beginning to avoid prematurely saving state.
   - Add `hasRestoredIndex` to the dependency array.

---

## 4. Agentic Verification

Execute the following commands to validate the implementation:

1. **Type & Lint Pass:** Run standard formatting and type checks.

```bash
   ./scripts/opencode-check.sh src/app/transcribe/workspace/_hooks/use-project-images.ts
```
