---
description: Ensure textareas in the transcription table expand vertically to accommodate multi-line content.
status: draft
targets:
  - src/app/transcribe/workspace/_components/transcription-table.tsx
context:
  - src/app/transcribe/workspace/_components/transcription-table.module.css
---

# Textarea Vertical Expansion

## 1. Architectural Boundary

- **Execution Context:** Client (Next.js & React 19)
- **Data Scope:** Local State

---

## 2. State Transition Matrix

### Fault / Current State

- **Condition:** A user enters multi-line text into a transcription table cell textarea.
- **Behavior:** The textarea is constrained to a single line (`rows={1}`) and does not expand vertically to reveal the rest of the text, hiding content from the user.
- **Log/Trace:**

```tsx
<textarea
  className={styles.input}
  value={row[column.id] || ''}
  onChange={(event_) => {
    // ...
  }}
  placeholder={column.title}
  disabled={!hasPageName}
  rows={1} // Constrained to 1 line
/>
```

### Target / Resolved State

- **Condition:** A user enters multi-line text or text that wraps.
- **Behavior:** The textarea automatically expands vertically based on its content, either via `field-sizing: content` CSS property, or by dynamically adjusting `style.height` to match `scrollHeight` on input.
- **Schema/Type Alteration:**

```tsx
// No schema changes. Component logic or styles updated to support auto-resizing.
```

---

## 3. Execution Pipeline

### 3.1. src/app/transcribe/workspace/\_components/transcription-table.tsx

1. Refactor the `<textarea>` implementation to dynamically adjust its height based on the content length.
2. Implement an auto-resize mechanism. This can be achieved by attaching a `ref` and adjusting `style.height` equal to `scrollHeight` within the `onChange` handler or a `useEffect`, OR by applying the modern CSS `field-sizing: content` (with graceful fallback if needed).
3. Update `src/app/transcribe/workspace/_components/transcription-table.module.css` if necessary to ensure `overflow: hidden` and `resize: none` are set properly for a seamless auto-expanding UX.

---

## 4. Agentic Verification

Execute the following commands to validate the implementation:

1. **Type & Lint Pass:** Run standard formatting and type checks.

```bash
   ./scripts/opencode-check.sh src/app/transcribe/workspace/_components/transcription-table.tsx
```

2. **Targeted Test Execution:** Run the specific route or backend test.

```bash
   yarn test src/app/transcribe/workspace/_components/transcription-table.test.tsx
```
