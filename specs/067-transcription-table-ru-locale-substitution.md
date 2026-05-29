---
description: Implement automatic cyrillic orthography substitution for 'ru' locale in transcription table inputs.
status: draft
targets:
  - src/app/transcribe/workspace/_components/transcription-table.tsx
context:
  - src/app/transcribe/workspace/page.tsx
---

# Transcription Table RU Locale Substitution

## 1. Architectural Boundary

- **Execution Context:** Client (Next.js & React 19)
- **Data Scope:** Local State

---

## 2. State Transition Matrix

### Fault / Current State

- **Condition:** A user types text into the transcription table inputs for a project with historical Russian orthography. Modern keyboards lack keys for letters like 'ѣ', 'ѳ', or 'ѵ'.
- **Behavior:** The input purely reflects standard keypresses (e.g. typing "еее" results in "еее" instead of substituting it for "ѣ"). The transcription process for 'ru' locale projects is slow and non-ergonomic.
- **Log/Trace:**

```ts
// User types "еее"
// Input value becomes "еее" instead of the expected "ѣ"
```

### Target / Resolved State

- **Condition:** The project's locale is defined as `"ru"`. The user types specific pre-defined character sequences into the transcription table inputs.
- **Behavior:** The input's `onChange` handler intercepts the new value, detects if `projectLocale === 'ru'`, and recursively or iteratively applies a replacement map to the string. The substituted string is then dispatched via `onUpdateRow`.
- **Schema/Type Alteration:**

```ts
interface TranscriptionTableProperties {
  columns: ColumnConfig[];
  rows: TranscriptionRow[];
  hasPageName: boolean;
  projectLocale?: string; // New prop for locale-aware logic
  onAddRow: (index?: number) => void;
  onDeleteRow: (id: string) => void;
  onUpdateRow: (id: string, field: string, value: string) => void;
}
```

---

## 3. Execution Pipeline

### 3.1. src/app/transcribe/workspace/\_components/transcription-table.tsx

1. Update `TranscriptionTableProperties` to accept `projectLocale?: string`.
2. Define the exact static mapping array outside the component:

   ```ts
   const REPLACEMENTS: [string, string][] = [
     ['иии', 'ы'],
     ['ььь', 'ъ'],
     ['еее', 'ѣ'],
     ['Ффф', 'Ѳ'],
     ['ФФФ', 'Ѳ'],
     ['ффф', 'ѳ'],
     ['ііі', 'ѵ'],
     ['ІІІ', 'Ѵ'],
     ['ЄЄЄ', 'Э'],
     ['єєє', 'э'],
     ['I', 'І'],
     ['i', 'і'],
   ];
   ```

3. Implement a helper function `applyReplacements(val: string): string` that iterates over `REPLACEMENTS` and applies `val.replaceAll(search, replace)` or equivalent string manipulation.
4. Update the `<input />` element's `onChange` handler:
   - Extract `event.target.value`.
   - If `projectLocale === 'ru'`, transform the value using `applyReplacements`.
   - Call `onUpdateRow(row.id, column.id, finalValue)`.

### 3.2. src/app/transcribe/workspace/page.tsx

1. Retrieve the project's locale from the project data/context.
2. Provide the `projectLocale` to `<TranscriptionTable />`.

---

## 4. Agentic Verification

Execute the following commands to validate the implementation:

1. **Type & Lint Pass:** Run standard formatting and type checks.

```bash
   ./scripts/opencode-check.sh src/app/transcribe/workspace/_components/transcription-table.tsx
```

2. **Targeted Test Execution:** (If applicable)

```bash
   yarn test src/app/transcribe/workspace/page.test.tsx
```
