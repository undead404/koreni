# Task: Relocate Table Language Selector in Koreni DataGrid

The beta feedback indicates the "Table Language" (Мова таблиці) selection is non-obvious because it is positioned below the data table. This task involves moving the language selection logic and UI into the `GridControlBar` component to improve visibility and control grouping.

## Proposed Changes

### 1. [`DataGrid`](../src/app/components/contribute2/data-grid.tsx)

- **Remove** the `label`, `select`, and `ErrorMessage` components from the bottom of the `DataGrid` component.
- **Pass** the `register` and `errors` (from `useFormContext`) as props to `GridControlBar`.

### 2. [`GridControlBar`](../src/app/components/contribute2/grid-control-bar.tsx)

- **Update Props Interface**: Add `register` and `errors` to the prop types.
- **Insert UI**: Place the language selection UI (label, select, and error message) within the control bar layout.
- **Layout**: Ensure the language selector is visually grouped with other table-wide settings (like skipped rows). Use existing CSS classes or minor additions to ensure the selector doesn't break the bar's alignment.

### 3. Styling

- Adjust [`data-grid.module.css`](../src/app/components/contribute2/data-grid.module.css) if necessary to ensure the `select` and `label` within the `GridControlBar` have appropriate spacing and do not inherit disruptive styles from the previous wrapper-level placement.

## Execution Requirements

- Maintain the exact `id`, `htmlFor`, and `value` options (`pl`, `ru`, `uk`).
- Ensure `ErrorMessage` still correctly targets `tableLocale`.
- The `select` must retain the `disabled` placeholder option.
