# CSS Architecture & Best Practices Refactoring Specification

The styling for the table page contains layout bugs, accessibility oversights, and outdated responsive techniques. Execute the following CSS modernization.

## 1. Target: `src/app/[tableId]/[page]/page.module.css`

- **Eradicate Viewport Units for Container Widths:**
  - Remove `max-width: calc(100vw - var(--side-gap) * 2);`.
  - Replace it with `width: 100%;` to respect the parent container's box model without colliding with the OS vertical scrollbar width.
- **Modernize Responsive Lists (CSS Grid):**
  - Delete the three `@media` queries controlling `column-count` for `.archiveItems`.
  - Replace them with a fluid, intrinsic CSS Grid definition:

    ```css
    .article .archiveItems {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: var(--side-gap);
    }
    ```

- **Accessibility Focus States:**
- Change `.tableContainer:focus` to `.tableContainer:focus-visible`.
- Replace the `border-color` mutation with a standard outline to prevent layout shifts:

  ```css
  .tableContainer:focus-visible {
    outline: 2px solid var(--clickable-color);
    outline-offset: -2px;
  }
  ```

- **Print Media Overrides:**
  - Remove the `@media screen` wrapper entirely. Let `.tableContainer` styles apply universally.
  - Append a strict `@media print` block at the bottom of the file to reset scroll constraints for physical rendering:

    ```css
    @media print {
      .tableContainer {
        overflow: visible;
        max-height: none;
        border: none;
      }
    }
    ```

- **Constrain Word Breaking:**
  - Change `overflow-wrap: anywhere;` on `.article p` to `overflow-wrap: break-word;` (or apply `word-break: break-all;` strictly to a utility class for links, rather than all paragraph text) to prevent aggressive breaking of standard vocabulary.
