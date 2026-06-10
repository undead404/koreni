---
description: Optimize creation of new rows in the transcription table
status: draft
targets:
  - src/app/transcribe/workspace/_components/transcription-table.tsx
context:
  - src/app/transcribe/workspace/_hooks/use-transcription-rows.ts
  - src/app/transcribe/workspace/page.test.tsx
---

# Optimize Creation of New Rows in Transcription Table

## 1. Architectural Boundary

- **Execution Context:** Client (Next.js & React 19)
- **Data Scope:** Local State

---

## 2. State Transition Matrix

### Fault / Current State

- **Condition:** The user needs to add new rows during transcription.
- **Behavior:** The "Додати рядок" (Add Row) button is located at the top of the table. This interrupts keyboard navigation and data entry flow. Additionally, there is no way to insert a row at a specific position (e.g., if a row was accidentally skipped).
- **Log/Trace:**

```tsx
// src/app/transcribe/workspace/_components/transcription-table.tsx
<div className={styles.tableHeader}>
  <h2>Транскрипція</h2>
  <button className={styles.addButton} onClick={onAddRow}>
    <Plus size={16} />
    Додати рядок
  </button>
</div>
```

### Target / Resolved State

- **Condition:** The user needs to add new rows during transcription.
- **Behavior:** The main "Додати рядок" button is moved to the bottom of the table, facilitating continuous data entry. Every row's "Дії" cell includes an inline icon button to insert a new empty row immediately above it.
- **Schema/Type Alteration:**

```ts
// src/app/transcribe/workspace/_hooks/use-transcription-rows.ts
export function useTranscriptionRows(columns: ColumnConfig[]) {
  // ...
  const addRow = (index?: number) => { ... };
  // OR introduce: const insertRow = (index: number) => { ... };
}

// src/app/transcribe/workspace/_components/transcription-table.tsx
interface TranscriptionTableProperties {
  // ...
  onAddRow: (index?: number) => void;
}
```

---

## 3. Execution Pipeline

### 3.1. `src/app/transcribe/workspace/_hooks/use-transcription-rows.ts`

1. Refactor `addRow` to optionally accept an `index: number` parameter, or introduce a new `insertRow(index: number)` method.
2. If `index` is provided, insert the new empty row at the specified `index` using array slicing or `splice`. If omitted, append it to the end.

### 3.2. `src/app/transcribe/workspace/_components/transcription-table.tsx`

1. Remove the "Додати рядок" `<button>` from `.tableHeader`.
2. Re-insert the "Додати рядок" `<button>` below the `<table>` element (after the `emptyState` conditional rendering block, but within `.tableContainer` or immediately after it).
3. Ensure the `TranscriptionTableProperties` matches the updated signature for `onAddRow`.
4. In the `<tbody>` row mapping function, capture the `index` of each row.
5. In the `.actionCell` `<td>`, prepend a new `<button>` before the `Trash2` button.
6. The new button should:
   - Use the `<Plus size={16} />` icon.
   - Have a `title="Додати рядок вище"` attribute.
   - Trigger `onAddRow(index)` (or the specific insert method) on click.
   - Be disabled when `!hasPageName`.
   - Use styling consistent with the action cell (e.g., `styles.iconButton` or a borderless variant similar to `styles.deleteButton`).

### 3.3. `src/app/transcribe/workspace/page.tsx`

1. Ensure the `addRow` function passed to `TranscriptionTable` supports the new signature.

### 3.4. `src/app/transcribe/workspace/page.test.tsx`

1. Update existing unit tests to reflect the changed DOM hierarchy for the "Додати рядок" button.
2. Add a test asserting that clicking the inline "Додати рядок вище" button successfully inserts a row at the correct index.

---

## 4. Agentic Verification

Execute the following commands to validate the implementation:

1. **Type & Lint Pass:** Run standard formatting and type checks.

```bash
   ./scripts/opencode-check.sh src/app/transcribe/workspace/_components/transcription-table.tsx
```

2. **Targeted Test Execution:** Run the specific route tests to ensure table functionality remains intact.

```bash
   yarn test src/app/transcribe/workspace/page.test.tsx
```
