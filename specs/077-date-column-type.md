---
description: Introduce a first-class 'date' ColumnExpectedType with react-imask masked input and partial ISO storage
status: draft
targets:
  - src/app/transcribe/workspace/_helpers/parse-partial-iso-date.ts
  - src/app/transcribe/workspace/_helpers/build-row-array-schema.ts
  - src/app/transcribe/workspace/_components/transcription-table.tsx
  - src/app/transcribe/api/get-project-schemas.ts
context:
  - src/app/transcribe/workspace/_helpers/column-config.ts
  - src/app/transcribe/workspace/_helpers/build-row-array-schema.ts
  - src/app/transcribe/workspace/_components/transcription-table.tsx
  - src/app/transcribe/api/get-project-schemas.ts
---

# Date Column Type — Masked ISO Input

## 1. Architectural Boundary

- **Execution Context:** Client (Next.js & React 19)
- **Data Scope:** Local State (transcription editor) → SQLite (raw JSON blob via existing PATCH endpoint)
- **New dependency:** `react-imask` (yarn add react-imask)

---

## 2. State Transition Matrix

### Fault / Current State

- **Condition:** `ColumnExpectedType` has `'date'` as a declared union member but it is entirely inert. `transcription-table.tsx` renders every non-`'number'` column as a plain `<textarea>`. No format is enforced on date values.
- **Behavior:** A date cell accepts arbitrary free text. There is no masking, no validation, and no consistent format that downstream consumers can rely on.

```ts
// 'date' exists in the union but is never branched on
export type ColumnExpectedType = 'date' | 'string' | 'number';

// All non-number columns fall through to <textarea>
column.expectedType === 'number' ? <input type="number" /> : <textarea />

// Zod schema treats every column identically regardless of expectedType
columns.map((column) => [column.id, z.string()])
```

### Target / Resolved State

- **Condition:** A `ColumnConfig` with `expectedType: 'date'` renders an `<IMaskInput>` that physically prevents invalid characters and auto-inserts `-` separators. The stored value is always a **Partial ISO** string or empty.
- **Behavior:** The mask enforces `YYYY-MM-DD` structure. The user may stop typing at any segment boundary — storing `YYYY`, `YYYY-MM`, or `YYYY-MM-DD`. The Zod row schema validates date columns against a strict Partial ISO regex.

**Partial ISO format contract (unknown digits are represented by absence, not `?`):**

| Stored value      | Meaning                           |
| ----------------- | --------------------------------- |
| `1743`            | Year only                         |
| `1743-05`         | Year + month                      |
| `1743-05-12`      | Full date                         |
| `` (empty string) | Row not yet filled — always valid |

Any other value (dot-separated, slash-separated, prose, partial digits mid-segment) is **invalid** and must be rejected by the Zod schema.

```ts
// Target Zod field for a date column
z.string().regex(PARTIAL_ISO_REGEX).or(z.literal(''))

// Target render branch (three-way)
expectedType === 'date'
  ? <IMaskInput mask="0000[-`0`0[-`0`0]]" ... />
  : expectedType === 'number'
  ? <input type="number" />
  : <textarea />
```

---

## 3. Dependency

Install `react-imask` before any implementation work:

```bash
yarn add react-imask
```

`react-imask` v7 ships its own TypeScript types. No `@types/` package is needed.

---

## 4. Execution Pipeline

### 4.1. `src/app/transcribe/workspace/_helpers/parse-partial-iso-date.ts` [NEW FILE]

Pure, side-effect-free utility. Must be accompanied by a co-located `parse-partial-iso-date.test.ts`.

1. Export a **`PARTIAL_ISO_REGEX`** constant (`RegExp`) that matches exactly the Partial ISO format described in §2. The regex must:
   - Accept `YYYY` (exactly 4 digits).
   - Accept `YYYY-MM` (year + `-` + month 01–12).
   - Accept `YYYY-MM-DD` (year + `-` + month 01–12 + `-` + day 01–31).
   - Be anchored (`^...$`).
   - Reject everything else: dots, slashes, prose, partial segments, single/double digit years, month 00 or 13+, day 00 or 32+.

2. Export a **`parsePartialIsoYear(value: string): number | null`** function:
   - Returns the integer year (first four characters via `parseInt`) if the value matches `PARTIAL_ISO_REGEX`.
   - Returns `null` for empty string or non-matching format.
   - No external dependencies. No I/O.

**Exhaustive test matrix for `parse-partial-iso-date.test.ts`:**

| Input           | `PARTIAL_ISO_REGEX` match | `parsePartialIsoYear` result |
| --------------- | ------------------------- | ---------------------------- |
| `'1743'`        | ✅                        | `1743`                       |
| `'1743-05'`     | ✅                        | `1743`                       |
| `'1743-05-12'`  | ✅                        | `1743`                       |
| `''`            | ❌                        | `null`                       |
| `'1743-13-01'`  | ❌                        | `null` (month 13 invalid)    |
| `'1743-00-01'`  | ❌                        | `null` (month 00 invalid)    |
| `'1743-05-00'`  | ❌                        | `null` (day 00 invalid)      |
| `'1743-05-32'`  | ❌                        | `null` (day 32 invalid)      |
| `'12.05.1743'`  | ❌                        | `null`                       |
| `'1743/05/12'`  | ❌                        | `null`                       |
| `'травня 1743'` | ❌                        | `null`                       |
| `'174'`         | ❌                        | `null` (incomplete year)     |
| `'1743-5'`      | ❌                        | `null` (single-digit month)  |

---

### 4.2. `src/app/transcribe/workspace/_helpers/build-row-array-schema.ts`

1. Import `PARTIAL_ISO_REGEX` from `./parse-partial-iso-date`.
2. Change the per-column Zod field mapping inside `buildRowArraySchema`:
   - `expectedType === 'date'` → `z.string().regex(PARTIAL_ISO_REGEX).or(z.literal(''))`.
   - `expectedType === 'number'` → `z.string()` (unchanged).
   - `expectedType === 'string'` → `z.string()` (unchanged).
3. All existing tests must continue to pass without modification.

**New test cases to add to `build-row-array-schema.test.ts`:**

- A `date` column accepts `'1743-05-12'`.
- A `date` column accepts `'1743-05'`.
- A `date` column accepts `'1743'`.
- A `date` column accepts `''` (empty — row not yet filled).
- A `date` column rejects `'12.05.1743'`.
- A `date` column rejects `'arbitrary prose'`.
- A `date` column rejects `'1743-13-01'` (invalid month).

---

### 4.3. `src/app/transcribe/workspace/_components/transcription-table.tsx`

#### 4.3.1. IMask pattern definition

The mask string for a Partial ISO date using react-imask Pattern mask syntax is:

```
0000[-`0`0[-`0`0]]
```

Breakdown:

- `0000` — exactly 4 required digits (year).
- `[-` ... `]` — optional block: literal `-` followed by month.
- `` `0`0 `` — two digits for month, with the `-` separator escaped as a fixed literal (`` ` `` prefix in imask prevents the separator from being shifted away on backspace).
- The inner `[-`0`0]` repeats the same pattern for day.

The mask must be configured with:

- `lazy: false` — placeholder characters are always shown, guiding the user.
- `placeholderChar: '_'` — unfilled positions show `_`.
- `overwrite: true` — typing over a filled position replaces rather than inserts.

#### 4.3.2. Controlled value integration

`react-imask`'s `IMaskInput` does **not** use `onChange`. It uses `onAccept`. The integration contract is:

- `value` prop: `row[column.id] ?? ''` — the currently stored Partial ISO string.
- `onAccept`: receives the masked string value (e.g. `'1743-05-12'`, `'1743'`, `''`). Call `onUpdateRow(row.id, column.id, acceptedValue)` inside this handler.
- Do **not** wire `onChange` on the `IMaskInput` element.

#### 4.3.3. Render branch replacement

Replace the existing two-branch render:

```ts
column.expectedType === 'number' ? <input type="number" /> : <textarea />
```

With a three-branch render:

1. `expectedType === 'number'` → `<input type="number" className={styles.input} />` (unchanged).
2. `expectedType === 'date'` → `<IMaskInput>` as specified in §4.3.1–4.3.2, with `className={styles.input}`, `disabled={!hasPageName}`, and `ref` forwarding for `firstCellReferences` identical to the other input types.
3. All other `expectedType` values → `<textarea />` (unchanged, including `applyReplacements` for `ru` locale).

The `applyReplacements` Cyrillic substitution must **not** be applied to date columns.

#### 4.3.4. Exhaustiveness guard

After the three branches, add a compile-time exhaustiveness guard so that adding a new `ColumnExpectedType` without handling it here produces a TypeScript error:

```ts
const _exhaustive: never = column.expectedType;
void _exhaustive;
```

---

### 4.4. `src/app/transcribe/api/get-project-schemas.ts`

1. Uncomment and complete `OLD_RUTHENIAN_PARISH_REGISTER_COLUMNS` with exactly two columns:

```ts
const OLD_RUTHENIAN_PARISH_REGISTER_COLUMNS: ColumnConfig[] = [
  {
    id: 'Дата',
    title: 'Дата',
    hint: 'Формат: РРРР-ММ-ДД (або частково: РРРР, РРРР-ММ)',
    expectedType: 'date',
  },
  {
    id: 'Подія',
    title: 'Подія',
    hint: 'Прозовий опис події з метрики',
    expectedType: 'string',
    isExtended: true,
  },
];
```

2. Add `'old-ruthenian-parish-register': OLD_RUTHENIAN_PARISH_REGISTER_COLUMNS` to `SCHEMA_COLUMNS`.

**Column `id` contract:** `'Дата'` and `'Подія'` are the exact keys serialised into the row JSON blob stored in SQLite. They must not be renamed after any transcription data has been saved under this schema.

---

## 5. Failure Modes & Edge Cases

| Scenario                                                        | Expected behaviour                                                                                 |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| User types `1743` and moves to the next cell                    | `onAccept` fires with `'1743'`; stored and hydrated correctly                                      |
| User types `1743-05` and stops                                  | `onAccept` fires with `'1743-05'`; stored correctly                                                |
| User clears the field entirely                                  | `onAccept` fires with `''`; stored as empty string; Zod accepts it                                 |
| Hydrated value `'1743-05-12'` loaded from SQLite                | `value` prop on `IMaskInput` pre-fills the mask correctly                                          |
| Hydrated value is malformed (e.g. `'12.05.1743'` from old data) | Zod `safeParse` fails; `use-transcription-rows.ts` falls back to empty row (existing failure path) |
| Schema has no `date` column                                     | No `IMaskInput` is rendered; `build-row-array-schema` uses `z.string()` for all columns as before  |
| New `ColumnExpectedType` added in future                        | TypeScript `never` guard in `transcription-table.tsx` surfaces a compile error immediately         |
| `react-imask` SSR                                               | `transcription-table.tsx` already carries `'use client'`; no SSR concern                           |

---

## 6. Agentic Verification

1. **Install dependency:**

```bash
yarn add react-imask
```

2. **Type & Lint Pass:**

```bash
./scripts/opencode-check.sh src/app/transcribe/workspace/_helpers/parse-partial-iso-date.ts
./scripts/opencode-check.sh src/app/transcribe/workspace/_helpers/build-row-array-schema.ts
./scripts/opencode-check.sh src/app/transcribe/workspace/_components/transcription-table.tsx
./scripts/opencode-check.sh src/app/transcribe/api/get-project-schemas.ts
```

3. **Targeted Test Execution:**

```bash
yarn test src/app/transcribe/workspace/_helpers/parse-partial-iso-date.test.ts
yarn test src/app/transcribe/workspace/_helpers/build-row-array-schema.test.ts
```
