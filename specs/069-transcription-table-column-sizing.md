---
description: Adjust transcription table column sizing to optimize space usage and differentiate default and extended columns.
status: draft
targets:
  - src/app/transcribe/workspace/_components/transcription-table.tsx
  - src/app/transcribe/workspace/_components/transcription-table.module.css
  - src/app/transcribe/workspace/page.tsx
  - src/app/transcribe/workspace/_hooks/use-transcription-rows.ts
context:
  - src/app/transcribe/workspace/page.tsx
---

# Transcription Table Column Sizing

## 1. Architectural Boundary

- **Execution Context:** Client (Next.js & React 19)
- **Data Scope:** Local State

---

## 2. State Transition Matrix

### Fault / Current State

- **Condition:** The user views the transcription workspace with 7 or more columns defined.
- **Behavior:** Some columns take up too much space, rendering inputs unnecessarily wide, while the ones intended for long text are squeezed. Much space is wasted on borders and gaps. All columns are treated equally for width.
- **Log/Trace:**

```ts
// All columns currently lack width definitions in their configuration:
export interface ColumnConfig {
  id: string;
  title: string;
  hint: string;
  expectedType: ColumnExpectedType;
}
```

### Target / Resolved State

- **Condition:** The table renders with a mix of default and extended columns.
- **Behavior:** Default columns have a stable, useful width of `3em`. Extended columns (like "Name" and "Note") consume the remaining available horizontal space equally, but shrink no smaller than `12em`. Inputs fill the cells compactly.
- **Schema/Type Alteration:**

```ts
export interface ColumnConfig {
  id: string;
  title: string;
  hint: string;
  expectedType: ColumnExpectedType;
  isExtended?: boolean; // Controls whether this column expands to fill remaining space
}
```

---

## 3. Execution Pipeline

### 3.1. src/app/transcribe/workspace/\_hooks/use-transcription-rows.ts

1. Add the `isExtended?: boolean` property to the `ColumnConfig` interface.

### 3.2. src/app/transcribe/workspace/page.tsx

1. Update the `POC_COLUMNS` array. Assign `isExtended: true` to the column configurations for `id: 'Name'` and `id: 'Note'`.

### 3.3. src/app/transcribe/workspace/\_components/transcription-table.module.css

1. Update `.table` layout behavior to support constrained width configurations.
2. Create class definitions (e.g., `.columnDefault` and `.columnExtended`) to manage column sizing.
   - For default columns: target a base dimension of `3em` (`width: 3em; min-width: 3em;`).
   - For extended columns: configure them to share available space but maintain a `min-width: 12em;`.
3. Consolidate wasted space by reducing padding/gaps inside `.table th` and `.table td` if necessary.

### 3.4. src/app/transcribe/workspace/\_components/transcription-table.tsx

1. In the `<thead>` mapping, attach the new sizing classes or specific styles to the `<th>` elements based on the value of `column.isExtended`.
2. Ensure consistent alignment down the columns by applying matching logic in the `<tbody>` `<td>` cells (or via an applied `<colgroup>`).
3. Ensure the `.input` elements continue to consume `100%` of their constrained parent cell without bleeding over the layout bounds.

---

## 4. Agentic Verification

Execute the following commands to validate the implementation:

1. **Type & Lint Pass:** Run standard formatting and type checks.

```bash
   ./scripts/opencode-check.sh src/app/transcribe/workspace/_components/transcription-table.tsx
   ./scripts/opencode-check.sh src/app/transcribe/workspace/page.tsx
   ./scripts/opencode-check.sh src/app/transcribe/workspace/_hooks/use-transcription-rows.ts

```

2. **Targeted Test Execution:** Verify Next.js routes related to this component.

```bash
   yarn test src/app/transcribe/workspace
```
