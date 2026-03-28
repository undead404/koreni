# Refactor `Header` Component

## Target component

- [`Header`](../src/app/components/header.tsx)
- [styles](../src/app/components/header.module.css)

## Goal

Refactor the `Header` component to improve accessibility, indicate the active route, and add the contribution link.

## Plan

1. Add the `"use client";` directive at the very top of the file.
2. Import `usePathname` from `next/navigation`.
3. Inside the `Header` component, initialize `const pathname = usePathname();`.
4. Remove all `title` attributes from the `<Link>` components (e.g., `title="Корені"`, `title="Головна сторінка"`).
5. For every `<Link>` in the navigation list (Пошук, Мапа, Таблиці, Волонтери, Про проєкт), implement active state logic:
   - Conditionally append an active CSS class (e.g., `styles.active`) to `className` when `pathname` matches the link's `href`.
   - Conditionally add the attribute `aria-current="page"` when `pathname` matches the link's `href`.
6. Add a new `<li>` element immediately before "Про проєкт".
7. Inside this new `<li>`, add a `<Link>` pointing to `href="/contribute"`.
8. Set the text for this new link to "Поділитися даними" and apply the same active state logic and base `styles.link` class as the other navigation items.
9. (CSS Context): Ensure the CSS module for `styles.navList` uses `display: flex` with either `flex-wrap: wrap` or `overflow-x: auto` to prevent mobile viewport breakage.
