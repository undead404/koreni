# Improve Header Component for Desktop Viewports

## Target component

- [`Header`](../src/app/components/header.tsx)
- [styles](../src/app/components/header.module.css)

## Goal

Refactor the CSS module to implement a split desktop navigation layout.

## Plan

1. In `Header.tsx`, restructure the JSX inside `<header>` to group the logo and CTA separately from the navigation list. Create a wrapper `<div>` (e.g., `<div className={styles.topBar}>`) containing:
   - The `<li>` containing the Logo `<Link>` (remove the `<li>` wrapper, it is no longer in a list).
   - The `<Link href="/contribute">` element (remove its `<li>` wrapper as well).
2. Apply a dedicated CTA class to the contribution link: `className={clsx(styles.ctaButton, pathname === '/contribute' && styles.active)}`. Ensure `aria-current` logic remains intact.
3. Keep the remaining secondary links ("Пошук", "Про проєкт", "Волонтери", "Мапа", "Таблиці") inside the `<nav>` and `<ul>` elements directly below the `.topBar` div.
4. In `header.module.css`, update `.header` to use `display: flex; flex-direction: column; gap: 16px;`. This stacks the `.topBar` and the navigation list vertically on mobile.
5. Create `.topBar` CSS: `display: flex; justify-content: space-between; align-items: center; width: 100%;`. This pins the Logo left and the CTA right on mobile.
6. The `.navList` CSS remains horizontal, scrollable, and masked as previously defined.
7. Add a desktop media query (e.g., `@media (min-width: 768px)`). Inside it:
   - Target `.header`: Change to `flex-direction: row; align-items: center;`.
   - Target `.topBar`: Change to `width: auto; flex-grow: 1;`.
   - Target `.ctaButton`: Apply `margin-left: auto;` to push it to the right edge.
   - Target `.navList`: Remove the mask gradient and set `overflow-x: visible
