# Architectural Layout Refactoring Specification

The global layout restricts full-bleed data tables and violates CSS encapsulation. Execute the following refactor to enable component-level width overrides.

## 1. Target: `src/app/layout.module.css`

- **Implement Variable-Driven Constraints:**
  - Remove the static `@media screen` wrapper.
  - Modify the `.main > *` selector to use a CSS variable with a fallback. This allows heavy data components (like the index table) to locally override their container width to `100%` while keeping text pages at `1024px`.

  ```css
  .main > * {
    width: 100%;
    max-width: var(--component-max-width, 1024px);
  }
  ```

- **Eradicate Global Selectors:**
- Delete the `.main > *:global(.col-sm)` block entirely.
- If specific pages require a 768px constraint, enforce it inside those specific page modules by setting `--component-max-width: 768px;` on their root wrapper.

- **Explicit Print Resets:**
- Append a strict print media query to strip flex layout computations and width restrictions for physical rendering.

  ```css
  @media print {
    .page,
    .main {
      display: block;
      min-height: auto;
      padding: 0;
    }

    .main > * {
      max-width: none !important;
      width: 100%;
    }
  }
  ```
