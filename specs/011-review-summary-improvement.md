# Aider Specification: ReviewSummary Component Refactoring

The current `ReviewSummary` component provides a basic text-based overview but fails to visually differentiate data types, lacks interactive navigation, and contains inefficient side effects. This refactor aims to improve user comprehension and component performance.

## Target component

- [`ReviewSummary`](../src/app/components/contribute2/review-summary.tsx)
- [`review-summary.module.css`](../src/app/components/contribute2/review-summary.module.css)
- [`useTableStateStore`](../src/app/components/contribute2/table-state.ts)
- [`ContributeForm2Values`](../src/app/components/contribute2/types.ts)

## 1. Architectural Improvements

### Extract Value Renderers

The `SummaryCard` currently treats all values as `ReactNode` or strings. Replace this with a dedicated `ValueRenderer` logic that handles:

- **Tags:** For `archiveItems` and `yearsRange`.
- **Empty States:** Distinctive styling for "Not provided" fields (italicized, lower opacity) instead of raw text.
- **Localization:** Ensure all numeric values continue to use `uk-UA` formatting but centralized.

### Optimizing Re-renders

`useWatch({ control })` without specific keys causes the entire summary to re-render on every keystroke in any form field.

- **Requirement:** Split `useWatch` into specific observers for each `SummaryCard` or pass specific dependency arrays to `useWatch` to isolate updates.

### Geocoding Logic

The current `useEffect` is prone to race conditions and unnecessary API calls.

- **Requirement:** Implement a 500ms debounce for the `reverseGeocode` call.
- **Requirement:** Transition `modernLocation` state to include a `status` ('loading' | 'idle' | 'error').

---

## 2. Visual & UX Enhancements

### Interactive Navigation

Users should be able to jump to the relevant form section from the summary.

- **Requirement:** Add an "Edit" (Редагувати) ghost button to each `SummaryCard` header.
- **Requirement:** Implementation should use a callback (e.g., `onEdit(sectionName)`) to trigger scrolling or tab switching in the parent container.

### Component Styling (`review-summary.module.css`)

- **Tags:** Implement the `.tag` and `.tagList` classes already defined in CSS for `archiveItems` and `yearsRange`.
- **Grid Layout:** Adjust the grid to `grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))` for better responsiveness.
- **Typography:** Increase `rowKey` contrast. Current `#64748b` on white/dark backgrounds may fail WCAG AA for small text.

---

## 3. Implementation Details

### Updated `SummaryCard` Interface

```typescript
interface SummaryField {
  key: string;
  value: string | string[] | number | null | undefined;
  type?: 'text' | 'tags' | 'location';
}

function SummaryCard({
  icon,
  title,
  fields,
  onEdit,
}: {
  icon: ReactNode;
  title: string;
  fields: SummaryField[];
  onEdit?: () => void;
});
```

### Data Mapping Logic

- **Location:** If `modernLocation` is fetching, show a subtle pulse animation or "Пошук..." (Searching...).
- **Archive Items:** Map `allValues.archiveItems` to individual tags.
- **Years:** Map `allValues.yearsRange` to tags. If it represents a range (e.g., [1850, 1900]), consider a "1850 — 1900" display instead of separate tags.

---

## 4. Technical Constraints & Clean Code

- **Validation:** Use the existing `coordinatesStringAsTupleSchema` but ensure errors don't crash the render; fallback to raw coordinates.
- **Accessibility:** Wrap the summary in a `<section aria-labelledby="summary-title">` and use `dl`, `dt`, `dd` tags for the key-value pairs to ensure semantic correctness for screen readers.
- **Icons:** Maintain `lucide-react` consistency.

---
