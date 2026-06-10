---
description: Refactor transcription table to be configuration-driven based on document types
status: draft
targets:
  - src/app/transcribe/workspace/_components/transcription-table.tsx
  - src/app/transcribe/workspace/_hooks/use-transcription-rows.ts
context: []
---

# Make Transcription Table Configuration-Driven

## 1. Architectural Boundary

- **Execution Context:** Client (Next.js & React 19)
- **Data Scope:** Local State

---

## 2. State Transition Matrix

### Fault / Current State

- **Condition:** Table columns and state fields are hardcoded to standard generic rows ("Прізвище", "Ім'я", "Рік народження / Вік", "Примітки").
- **Behavior:** The application cannot adapt to specific historical document types which have varying layouts and column sets, limiting transcription accuracy and UX.
- **Log/Trace:**

```ts
export interface TranscriptionRow {
  id: string;
  lastName: string;
  firstName: string;
  yearOrAge: string;
  notes: string;
}
```

### Target / Resolved State

- **Condition:** The table receives a configuration object specifying dynamic columns for a specific document type.
- **Behavior:** The component dynamically maps through the configured columns to render headers with tooltips (hints), and proper cell inputs (text/number). The row state handles arbitrary keys.
- **Schema/Type Alteration:**

```ts
export type ColumnExpectedType = 'string' | 'number';

export interface ColumnConfig {
  id: string;
  title: string;
  hint: string;
  expectedType: ColumnExpectedType;
}

export interface TranscriptionRow extends Record<string, string> {
  id: string;
}
```

---

## 3. Execution Pipeline

### 3.1. src/app/transcribe/workspace/\_hooks/use-transcription-rows.ts

1. Refactor the `TranscriptionRow` interface to be a dynamic record with a required `id: string` property.
2. Update `useTranscriptionRows` hook to accept a parameter for `columns: ColumnConfig[]`.
3. Modify the initial row and `addRow` logic to dynamically populate empty strings for keys matching the provided `columns` configuration instead of the hardcoded default keys.
4. Modify `updateRow` signature to accept `field: string` (instead of `keyof TranscriptionRow`) and assign it correctly within the row map update.

### 3.2. src/app/transcribe/workspace/\_components/transcription-table.tsx

1. Import or define the `ColumnConfig` interface. Update `TranscriptionTableProperties` to require `columns: ColumnConfig[]`.
2. Refactor the `<thead>` layout to iterate over `columns`. Keep the static `Дії` (Actions) column at the end. Render the `title` and add tooltip UI logic for the `hint` when it evaluates to a non-empty string.
3. Refactor the `<tbody>` layout so each `<tr>` iterates over `columns` to render `<td>` inputs. Bind the `value` and `onChange` using the `column.id`.
4. Render the `input` HTML element's `type` attribute dynamically, mapping `expectedType === 'number'` to `type="number"` and defaulting to `type="text"`.

### 3.3. src/app/transcribe/workspace/page.tsx (or parent container)

1. Instantiate the Proof of Concept (PoC) "confession-list" configuration and pass it into `useTranscriptionRows` and `TranscriptionTable`.
2. The PoC columns array must be strictly defined as:
   - `{ id: 'HH', title: '#HH', hint: 'Number of household', expectedType: 'number' }`
   - `{ id: 'M', title: '#M', hint: 'Number of male', expectedType: 'number' }`
   - `{ id: 'F', title: '#F', hint: 'Number of female', expectedType: 'number' }`
   - `{ id: 'Name', title: 'Name', hint: '', expectedType: 'string' }`
   - `{ id: 'aM', title: 'aM', hint: 'Age of male', expectedType: 'string' }`
   - `{ id: 'aF', title: 'aF', hint: 'Age of female', expectedType: 'string' }`
   - `{ id: 'Note', title: 'Note', hint: 'Anything to the right of the age', expectedType: 'string' }`

---

## 4. Agentic Verification

Execute the following commands to validate the implementation:

1. **Type & Lint Pass:** Run standard formatting and type checks.

```bash
   ./scripts/opencode-check.sh src/app/transcribe/workspace/_components/transcription-table.tsx
   ./scripts/opencode-check.sh src/app/transcribe/workspace/_hooks/use-transcription-rows.ts

```

2. **Targeted Test Execution:** Run the specific route or frontend tests.

```bash
   yarn test src/app/transcribe/workspace/page.test.tsx

```
