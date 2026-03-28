# Improve Header Component for Responsive Viewports

## Target component

- [`Header`](../src/app/components/header.tsx)
- [styles](../src/app/components/header.module.css)

## Goal

Update the Header component to permanently prioritize the "Про проєкт" link in the DOM, and implement a single-line, horizontally scrollable navigation track for mobile viewports.

## Plan

1. In the `Header` component's JSX, move the `<li>` containing the "Про проєкт" link to be the second textual link, immediately following the `<li>` containing "Пошук".
2. Reorder the `<ul>`, so the order would be: Logo, "Пошук", "Про проєкт", "Поділитися даними", "Волонтери", "Мапа", "Таблиці".
3. Modify the `styles.navList` class in `header.module.css` to strictly prevent wrapping and enable horizontal scrolling:
   - Apply `display: flex; flex-direction: row; flex-wrap: nowrap;`
   - Apply `overflow-x: auto; -webkit-overflow-scrolling: touch;`
   - Apply `align-items: center;` and define a consistent `gap` (e.g., `16px`).
   - Update `styles.navList` in `header.module.css`:
     - Apply `display: flex; flex-direction: row; flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch; align-items: center; gap: 16px;`.
     - Explicitly DO NOT hide scrollbars. Ensure native scrollbars remain visible.
     - Apply `mask-image: linear-gradient(to right, black 90%, transparent 100%);` (and the `-webkit-` prefixed version) to create a visual fade at the right edge, signaling overflow.
4. Prevent flex children from collapsing: Target the `<li>` elements inside `.navList` and apply `flex-shrink: 0;`.
5. Ensure the active state indicator (e.g., bottom border or background) accounts for the new `flex-shrink: 0` dimensions so styling does not break when swiping.
6. Apply left and right padding to the `.navList` container so the first and last items do not sit flush against the screen edges when scrolled to the extremities.
