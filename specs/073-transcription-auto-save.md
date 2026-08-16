---
description: Implement interval-based auto-save and window close preservation for transcription rows.
status: draft
targets:
  - src/app/transcribe/workspace/_hooks/use-transcription-rows.ts
context: []
---

# Auto-Save Transcription Rows

## 1. Architectural Boundary

- **Execution Context:** Client (Next.js & React 19)
- **Data Scope:** Local State

---

## 2. State Transition Matrix

### Fault / Current State

- **Condition:** Users edit transcription rows, but data is only held in local state. If the user closes the window, navigates away, or doesn't explicitly save, their progress is lost.
- **Behavior:** `useTranscriptionRows` purely manages local state without any background persistence mechanism.
- **Log/Trace:**

```ts
// Local state mutations do not trigger any side-effects to persist data
const [rows, setRows] = useState<TranscriptionRow[]>(() => [createEmptyRow()]);
```

### Target / Resolved State

- **Condition:** Any deep change in `rows` triggers an interval-based (every 2 minutes) sync if changes occurred. Additionally, closing the window must trigger a reliable save of the current, unsaved changes.
- **Behavior:** The hook accepts `projectId` and `imageId` to construct the save endpoint. It uses a 2-minute interval to periodically send a `PATCH` request to `/api/transcribe/projects/:projectId/images/:imageId` with payload `{ transcription: JSON.stringify(rows) }` IF there are deep changes since the last save. It also registers a `pagehide`/`beforeunload` event listener to perform the same save operation on window close.
- **Schema/Type Alteration:**

```ts
export function useTranscriptionRows(
  columns: ColumnConfig[],
  projectId: string,
  imageId: string,
) {
  // Return type remains the same, but internal behavior includes side-effects
}
```

---

## 3. Execution Pipeline

### 3.1. src/app/transcribe/workspace/\_hooks/use-transcription-rows.ts

1. **Dependency Injection:** Update the `useTranscriptionRows` hook signature to require `projectId: string` and `imageId: string`.
2. **Deep Change Tracking:** Introduce a `useRef` to hold the serialized state of the last successfully saved `rows`. Use `JSON.stringify` for serialization.
3. **Save Functionality:** Create a `saveTranscription` internal function. It should:
   - Compare the current `JSON.stringify(rows)` against the last saved ref.
   - If changed, perform a `fetch` request (`PATCH /api/transcribe/projects/${projectId}/images/${imageId}`) with `{ transcription: JSON.stringify(rows) }`.
   - Update the last saved ref upon successful request.
   - For window close reliability, the `fetch` call should utilize the `keepalive: true` flag.
4. **Interval Auto-Save:** Implement a `useEffect` that sets up a `setInterval` to execute `saveTranscription` every 2 minutes (120,000 ms). Ensure the interval is cleared on hook unmount.
5. **Window Close Save:** Implement a `useEffect` to attach a `pagehide` (and optionally `visibilitychange` for modern mobile browser reliability) event listener on the `window` object to trigger a final `saveTranscription` immediately before the document is unloaded.

---

## 4. Agentic Verification

Execute the following commands to validate the implementation:

1. **Type & Lint Pass:** Run standard formatting and type checks.

```bash
   ./scripts/opencode-check.sh src/app/transcribe/workspace/_hooks/use-transcription-rows.ts
```

2. **Targeted Test Execution:** Run the relevant frontend tests if available.

```bash
   yarn test src/app/transcribe/workspace/_hooks/use-transcription-rows.test.ts
```
