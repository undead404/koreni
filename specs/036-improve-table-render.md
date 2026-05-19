# Table Architectural & Accessibility Refactoring Specification

The table rendering pipeline suffers from severe semantic fragmentation, JavaScript-driven layout anti-patterns, and WCAG failures. Execute the following structural overhaul across the component tree.

## 1. Target: `src/app/components/index-table-cell.tsx`

- **Semantic Casting:** Accept a new boolean prop `isRowHeader`. If `true`, render a `<th scope="row">` root element. If `false`, render a `<td>`.
- **Link Generation:** Intercept strings starting with `http://` or `https://`. Do not just apply a CSS class; wrap the string in a semantic anchor tag: `<a href={value} aria-label="Відкрити посилання" target="_blank" rel="noopener noreferrer">Google Docs</a>`.
- **CSS Decoupling:** Remove the `className` array logic entirely. Delete the `value.length < 80` and `value.startsWith('http')` checks. Let CSS table specifications handle layout overflow globally.

## 2. Target: `src/app/components/index-table-row.tsx`

- **Nullish Coalescing Optimization:** Remove `String(value ?? '')` wrapper. Let the cell handle type coercion and empty-state rendering explicitly. Pass the raw `value` or guarantee a string cast without masking nullish types as valid empty strings at this layer.

## 3. Target: `src/app/components/index-table.tsx`

- **Header Scoping:** Inject `scope="col"` into the dynamically generated `<th>` tags within the `<thead>`.
- **Style Extraction:** Remove the inline string length arrays (`key.length < 50 ? 'text-nowrap' : ''`). Move layout control to `index-table.module.css` using `table-layout: auto` or column-specific `max-width` properties with `white-space: nowrap` and `text-overflow: ellipsis`.

## 4. Target: `src/app/[tableId]/[page]/table-content.tsx`

- **Semantic Grouping:** Wrap the `<h1>` and the adjacent `<section>` containing "Метадані" inside a single `<header>` element.
- **Section Labelling:** Add `id="metadata-heading"` to the `<h2>Метадані</h2>` tag and apply `aria-labelledby="metadata-heading"` to its parent `<section>`.
