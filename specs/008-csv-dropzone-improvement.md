# Task: Enhance CsvDropzone UX and Logic Refactoring

## Target component

- [`CsvDropzone`](../src/app/components/contribute2/csv-dropzone.tsx)
- [`csv-dropzone.module.css`](../src/app/components/contribute2/csv-dropzone.module.css)
- [`useTableStateStore`](../src/app/components/contribute2/table-state.ts)
- [`DropzoneState`, `ParsedFile`](../src/app/components/contribute2/types.ts)

## Objective

Refactor `CsvDropzone.tsx` and its styles to improve user confidence during data contribution. The component must provide clearer feedback, stricter validation, and more robust state management.

## 1. Logic & State Refactoring

- **Async/Await:** Rewrite `processFile` using `async/await` for better readability.
- **Explicit Loading State:** Ensure `setState('uploading')` is called immediately when a file is accepted, before parsing begins.
- **File Size Validation:** Implement a strict 50MB limit check in JavaScript before parsing. If it fails, set an error state and do not attempt to parse.
- **Error Granularity:** Distinguish between "Invalid File Type," "File Too Large," and "Parsing Error" in the UI rather than a generic error state.

## 2. UX & Instructional Improvements

- **Data Preview Summary:** Expand the `success` state. Instead of just "Файл готовий," include a brief "Next Steps" hint (e.g., "Перевірте дані нижче та заповніть решту полів").
- **Empty State Prevention:** If a user drops a folder or an incompatible blob, provide immediate "invalid format" feedback.
- **Accessibility:** - Ensure the `role="button"` has proper `aria-expanded` or `aria-controls` if it reveals further form sections.
  - Add `aria-live="polite"` to the status messages so screen readers announce "Розбирання файлу" and "Файл готовий."

## 3. Styling & UI Enhancements

- **CSS Variables:** Refactor `csv-dropzone.module.css` to use a local set of CSS variables for colors (e.g., `--dz-border`, `--dz-bg`) to simplify dark mode logic and state transitions.
- **Visual Continuity:** The `.dropzoneSuccess` state should feel like a "completed" card rather than an active input. Soften the border and remove the hover "lift" effect once a file is accepted.
- **Micro-animations:** Add a subtle fade-in for the `tableInfo` and `fileInfo` sections to make the transition from uploading to success feel smoother.

## 4. Technical Cleanup

- **Utility Extraction:** Move `formatBytes` and `isCsvFile` to separate modules in `/src/app/helpers` folder, to keep the component file focused on UI logic.
- **Bugsnag/Posthog:** Ensure the `finally` block in `processFile` does not overwrite the `success` state unintentionally.

## Constraints

- Maintain the existing `useTableStateStore` and `useContributionStateStore` integrations.
- Do not change the underlying `react-hook-form` registration logic.
- Keep all UI text in Ukrainian as per the current implementation.
