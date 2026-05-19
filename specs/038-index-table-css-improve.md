# Table CSS Performance & Layout Specification

The current stylesheet suffers from $O(N^2)$ layout calculation bottlenecks, encapsulation leaks, and broken sticky contexts. Execute the following CSS modernization.

## 1. Target: `src/app/components/index-table.module.css`

- **Eradicate Render-Blocking Borders:**
  - Replace `border-collapse: collapse;` with `border-collapse: separate;` and `border-spacing: 0;`. This decouples cell border calculations, restoring linear $O(N)$ paint performance for 1000-row matrices.
- **Fix Sticky Context Bleed:**
  - The `.thead` requires a `z-index` to prevent the 1000 rows of `.tbody` content from bleeding over the headers during scroll.
  - Move the background color assignment from `.thead tr:first-child` directly to `.thead th`. Sticky positioning on `<tr>` or `<thead>` is notoriously buggy across browser engines; it must be applied or reinforced at the `<th>` level.
- **Resolve Sizing & Encapsulation Violations:**
  - Delete the `.table th:global(.break-word)` block. Global class leaks are forbidden.
  - To accommodate the variance between single digits, empty cells, and massive unwrapped strings without breaking the DOM, leverage intrinsic CSS sizing combined with text truncation.
- **Border Application for Separated Cells:**
  - Because `border-collapse` is now `separate`, standard `border-bottom` and `border-right` rules will double up if not applied correctly. Ensure borders are strictly directional to simulate a collapsed look without the render cost.

### Apply the following structural updates to the file

```css
.table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 1rem;
  text-align: left;
  /* Allows table to naturally size columns based on content (digits vs text) */
  table-layout: auto;
}

.thead th {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: var(--table-row-header-bg);
  color: var(--table-row-header-text);
  padding: 10px;

  /* Simulate collapsed top border if necessary */
  border-top: var(--default-border);
  border-bottom: var(--default-border);
}

.tbody td {
  padding: 10px;
  border-bottom: var(--default-border);

  /* Base handling for long text vs single digits */
  max-width: 400px; /* Constrain massive text cells */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Permit hover to reveal truncated text without JavaScript */
.tbody td:hover {
  white-space: normal;
  word-break: break-word;
  overflow: visible;
}

.tbody tr:nth-child(even) td {
  background-color: var(--table-row-even-bg);
}

.tbody tr:hover td {
  background-color: var(--table-row-hover-bg);
}

/* Directional borders to prevent doubling */
.thead th:not(:last-child),
.tbody td:not(:last-child) {
  border-right: var(--default-border);
}

/* Ensure the left-most edge is closed if required by design */
.thead th:first-child,
.tbody td:first-child {
  border-left: var(--default-border);
}
```
