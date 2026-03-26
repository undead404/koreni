# Aider Specification: Refactor DataGrid for Koreni Project

The current `DataGrid` implementation is a monolithic, non-performant component with flawed index logic and brittle CSS. This task requires a complete refactor into a modular architecture using CSS variables and optimized React patterns.

---

## Target Component

- [`DataGrid`](../src/app/components/contribute2/data-grid.tsx)
- [`data-grid.module.css`](../src/app/components/contribute2/data-grid.module.css)
- [`useTableStateStore`](../src/app/components/contribute2/table-state.ts)
- [`UnknownValue`](../src/app/components/unknown-value.tsx)
- [`ContributeForm2Values`](../src/app/components/contribute2/types.ts)

---

## 1. Component Decomposition

Split `data-grid.tsx` into the following structure within the same directory:

- **`GridControlBar.tsx`**: Logic for `skippedRowsAbove` input and statistic badges.
- **`GridTable.tsx`**: The `<table>` shell, `<thead>`, and sticky logic.
- **`GridRow.tsx`**: A memoized component representing a single `<tr>`.
- **`GridPagination.tsx`**: The "Show more" ellipsis rows and expansion logic.
- **`useGridPreview.ts`**: Custom hook to handle row slicing logic (`topRows`, `bottomRows`, `hiddenCount`).

---

## 2. Technical Requirements

### Logic & Performance

- **Remove Global State**: Delete `incrementalId` and `getIncrementalId`. Use React’s `useId()` for DOM IDs. Use stable data properties or `globalRowIndex` for React keys.
- **Fix Indexing**: Correct the calculation for `globalRowIndex` in the bottom section. It must account for `skippedRowsAbove + topRows.length + hiddenCount + localIndex`.
- **Memoization**: Wrap `GridRow` in `React.memo`. Memoize the `columns` array and the `renderRows` mapping logic to prevent unnecessary re-renders when parent state (like `tableLocale`) changes.
- **Hook Extraction**: Move the slicing logic from `useMemo` into `useGridPreview` to keep the UI components focused on rendering.

### CSS Refactoring (`data-grid.module.css`)

- **CSS Variables**: Define a `:root` (or `.wrapper`) block with variables for:
  - `--grid-bg`, `--grid-header-bg`, `--grid-border`
  - `--grid-text-primary`, `--grid-text-muted`
  - `--grid-flagged-bg`, `--grid-flagged-text`

- **Dark Mode**: Consolidate all dark mode overrides into a single `@media (prefers-color-scheme: dark)` block that updates the variables. Remove inline media queries throughout the file.
- **Sticky Positioning**: Use `inset-inline-start: 0` for `.thRowCtrl` and `.tdRowCtrl`. Ensure `z-index` values are managed via variables (e.g., `--z-sticky-header: 20`, `--z-sticky-col: 10`).

### Accessibility & UX

- **Interactive Elements**: Ensure `Trash2` buttons have a minimum hit area and proper focus visible states.

- **ARIA**: Update `aria-label` attributes to be dynamic (e.g., "Toggle removal of column [Name]").
- **Expand Buttons**: Ensure the "Show more" buttons are keyboard-accessible and provide clear feedback to screen readers regarding how many rows will be added.

---

## 3. Implementation Plan

1. **Extract `useGridPreview` hook** and verify slicing logic via unit-like analysis.
2. **Create sub-components** (`GridControlBar`, `GridPagination`) and move existing logic into them.
3. **Refactor `GridRow`** to accept only necessary props (row data, flagged status, toggle handlers).
4. **Rewrite CSS** to use the variable-first approach.
5. **Clean up `data-grid.tsx`** to serve as the lean orchestrator.

---
