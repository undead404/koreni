---
description: Fix styles with bad accessibility in dark theme for the transcribe module components.
targets:
  - src/app/transcribe/components/logout-button.module.css
  - src/app/transcribe/transcribe/page.module.css
context:
  - src/app/transcribe/components/logout-button.tsx
  - src/app/transcribe/transcribe/page.tsx
---

# Fix Transcribe Dark Theme Style Accessibility

## 1. Context & Scope

- **Target Components:**
  - `LogoutButton` in `src/app/transcribe/components/logout-button.tsx`
  - `TranscribeProjectPage` in `src/app/transcribe/transcribe/page.tsx`
- **Related Files:**
  - `src/app/transcribe/components/logout-button.module.css`
  - `src/app/transcribe/transcribe/page.module.css`
- **Trigger State:** Dark theme/mode active via `@media (prefers-color-scheme: dark)`.

---

## 2. Current Behavior (Actual)

In dark theme, the background color defaults to `#212121` via global variables. The targeted CSS modules have hardcoded light-theme color values that lack dark-mode media query overrides, leading to critical WCAG AA accessibility/contrast failures:

### 2.1. `src/app/transcribe/transcribe/page.module.css`

- **`.title`**: Has `color: #111`. On a dark background (`#212121`), this results in an extremely low contrast ratio of **1.2:1**, making the header unreadable.
- **`.message`**: Has `color: #333`. On a dark background, this results in a contrast ratio of **1.3:1**, making the text unreadable.
- **`.loading`, `.error`**: Have `color: #666`. On a dark background, this results in a contrast ratio of **2.3:1**, which is well below the WCAG AA requirement of **4.5:1**.
- **`.button`**: Has `background-color: #0070f3` with `color: white`. This does not leverage the project's standard interactive theme colors or transition guidelines.

### 2.2. `src/app/transcribe/components/logout-button.module.css`

- **`.root`**: Has `background-color: #dc2626` and `color: #fff`. It does not define an explicit hover state or keyboard/focus-adjacent color updates. Additionally, in dark theme, this crimson button lacks any specific aesthetic adaptation or hover states.

---

## 3. Expected Behavior (Target)

Every element must have a minimum of **4.5:1** contrast ratio (WCAG AA) in both light and dark themes.

### 3.1. Transcribe Page (`src/app/transcribe/transcribe/page.module.css`)

- Adapt automatically using global CSS variables instead of hardcoded hex values:
  - `.title`: Use `var(--text-color)`. (Resolves to `#212121` on light, `#f0f0f0` on dark — Contrast ratio > **12:1** on both).
  - `.message`: Use `var(--text-color)`.
  - `.loading`, `.error`: Use `var(--description-color)`. (Resolves to `#777` on light, `#888` on dark — Contrast ratio > **4.5:1** on both).
  - `.button`: Use standard project-wide colors:
    - `background-color: var(--clickable-color)`.
    - `color: var(--reversed-text-color)`.
    - Transition should use standard button hover behavior: `transition: opacity 0.2s ease` and `.button:hover { opacity: 0.9; }`.

### 3.2. Logout Button (`src/app/transcribe/components/logout-button.module.css`)

- Implement a clear hover state:
  - `.root:hover { background-color: #b91c1c; }` for light theme.
- Adapt the red danger background and text dynamically for dark theme using `@media (prefers-color-scheme: dark)`:
  - In dark mode, `.root` should use a slightly darker, rich red background `background-color: #b91c1c` with `color: #fff`. (Contrast ratio on dark background is **5.61:1**, passing WCAG AA).
  - In dark mode, `.root:hover` should transition to `background-color: #991b1b`.

---

## 4. Constraints & Technical Requirements

- Adhere strictly to **Zone A** constraints (Frontend: Next.js 15, React 19, TypeScript).
- Leverage existing root CSS variables where applicable (`var(--text-color)`, `var(--description-color)`, `var(--clickable-color)`, `var(--reversed-text-color)`) to avoid manually writing redundant color variables.
- Do not modify Javascript/TypeScript files (`page.tsx` or `logout-button.tsx`) since the issue is purely styling. Keep all changes isolated inside `logout-button.module.css` and `page.module.css`.
