---
description: Fix styles with bad accessibility in dark theme for the transcribe header component by utilizing global CSS variables.
targets:
  - src/app/transcribe/components/transcribe-header.module.css
context:
  - src/app/transcribe/components/transcribe-header.tsx
  - src/app/globals.css
---

# Fix Transcribe Header Dark Theme Style Accessibility

## 1. Context & Scope

- **Target Component:** `TranscribeHeader` in `src/app/transcribe/components/transcribe-header.tsx`
- **Related Files:**
  - `src/app/transcribe/components/transcribe-header.module.css`
  - `src/app/globals.css`
- **Trigger State:** Dark theme/mode active via `@media (prefers-color-scheme: dark)`.

---

## 2. Current Behavior vs. Target State

### Current Behavior

Currently, the container styles inside `src/app/transcribe/components/transcribe-header.module.css` use hardcoded colors:

```css
.root {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem;
  background-color: #fff;
  border-bottom: 1px solid #e5e7eb;
}
```

- **Background Color:** Hardcoded to `#fff`.
- **Border Bottom:** Hardcoded to `1px solid #e5e7eb`.
- **Accessibility Impact:** In dark mode, the container retains its bright white `#fff` background. However, the text inside the header (such as the `<p>Transcribe</p>` and nested content from `UserView`) inherits the body's dark mode text color (`var(--text-color)` which is `#f0f0f0`). This results in almost white text rendering over a white background, creating an illegible contrast ratio of approximately **1.1:1**, which is a critical WCAG AA/AAA violation.

### Target State

- **Background Color:** The header should adapt dynamically, matching the rest of the application's layout background.
- **Border Bottom:** The border should adapt to the theme-specific border colors.
- **Accessibility Impact:** By using global, theme-aware CSS variables defined in `globals.css` (`var(--bg-color)` and `var(--default-border)`), the header adapts automatically. In dark mode, the background becomes `#212121` and the border changes to `#444`. The text retains its inherited `var(--text-color)` (`#f0f0f0` in dark mode), resulting in a contrast ratio exceeding **12:1** and fully passing WCAG AA requirements.

---

## 3. Detailed Specifications

### 3.1. Style Adjustments (`src/app/transcribe/components/transcribe-header.module.css`)

Modify the `.root` class selector to utilize theme variables instead of hardcoded hex values:

```css
.root {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem;
  background-color: var(--bg-color);
  border-bottom: var(--default-border);
}
```

---

## 4. Constraints & Technical Requirements

- Adhere strictly to **Zone A** constraints (Frontend: Next.js 15, React 19, TypeScript).
- Leverage existing global root CSS variables (`var(--bg-color)` and `var(--default-border)`) from `globals.css` to maintain theme coherence.
- Do not modify TypeScript files (`transcribe-header.tsx`) as this is a purely style-level correction. Keep all changes isolated inside `transcribe-header.module.css`.
