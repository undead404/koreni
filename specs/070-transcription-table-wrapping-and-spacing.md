---
description: Make transcription table text fields wrap and eliminate gaps between cells to create a 1px border effect.
status: draft
targets:
  - src/app/transcribe/workspace/_components/transcription-table.tsx
  - src/app/transcribe/workspace/_components/transcription-table.module.css
context:
  - src/app/transcribe/workspace/_components/transcription-table.module.css
---

# Transcription Table Text Wrapping and Cell Spacing

## 1. Architectural Boundary

- **Execution Context:** Client (Next.js & React 19)
- **Data Scope:** N/A (Styling / UI)

---

## 2. State Transition Matrix

### Fault / Current State

- **Condition:** Long text in table inputs is truncated or hidden (due to `<input type="text">`), making it difficult to read and edit. The table cells have spacing between them, rather than a collapsed 1px border structure.
- **Behavior:** The `input[type="text"]` element restricts text to a single line by HTML spec. The `<table>` styling has spacing (e.g. `border-spacing` or missing `border-collapse: collapse`) that creates visible gaps between fields instead of a shared 1px border.
- **Log/Trace:**

```css
/* Expected failing state representation */
.table {
  /* missing border-collapse: collapse; */
}
.input {
  /* <input> element does not natively support multi-line text wrapping */
}
```

### Target / Resolved State

- **Condition:** Users typing long text into transcription cells need full visibility via text wrapping. The UI must be densely packed with standard 1px borders between cells.
- **Behavior:** Standard text columns are rendered using `<textarea>` elements allowing text to wrap naturally. The parent `<table>` utilizes `border-collapse: collapse` and zero-spacing techniques to render exactly 1px borders shared between adjacent cells, and the inner inputs/textareas are styled to seamlessly blend into the cells without extra borders.
- **Schema/Type Alteration:**

```ts
// No specific schema alterations required, but transcription-table.tsx will swap `<input>` for `<textarea>` where applicable.
```

---

## 3. Execution Pipeline

### 3.1. src/app/transcribe/workspace/\_components/transcription-table.tsx

1. Change the input element inside the table's data cells to a `<textarea>` for standard string columns (or use a dynamic component that renders textarea for strings and input for numbers). The `<textarea>` is necessary because `<input type="text">` cannot wrap text onto multiple lines.
2. Bind the existing `onChange` logic, `value`, and `placeholder` properly to the new `<textarea>`. Set attributes like `rows={1}` (with CSS auto-expansion or fixed minimal height) to maintain baseline layout integrity.

### 3.2. src/app/transcribe/workspace/\_components/transcription-table.module.css

1. Update `.table` to enforce `border-collapse: collapse;` and eliminate any `border-spacing`.
2. Add a standard 1px solid border declaration to the `th` and `td` elements.
3. Update `.input` (which will now apply to `textarea` as well) to remove its own border and background: `border: none; background: transparent; resize: none; width: 100%; height: 100%; box-sizing: border-box; overflow: hidden;`.
4. Define styling so the `textarea` fills the cell flush, making the table look like a single grid with 1px borders inside. Add `:focus` styles that do not break the table flow (e.g., standard outline inset or background highlight).

---

## 4. Agentic Verification

Execute the following commands to validate the implementation:

1. **Type & Lint Pass:** Run standard formatting and type checks.

```bash
   ./scripts/opencode-check.sh src/app/transcribe/workspace/_components/transcription-table.tsx
```

2. **Targeted Test Execution:** Validate standard client tests pass.

```bash
   yarn test src/app/transcribe/workspace/_components/
```
