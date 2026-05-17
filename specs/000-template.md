# Visual/Layout Bug Task

## 1. Context & Scope

- **Target Component:** [e.g., `Navigation` in `src/components/Navigation.tsx`]
- **Related Files:** [List explicit paths, e.g., `Navigation.tsx`, `layout.css`, `types/index.ts`]
- **Trigger State:** [e.g., Mobile viewport < 768px, `isMenuOpen` prop is `true`]

## 2. Current Behavior (Actual)

- **Structural Issue:** [e.g., The dropdown menu renders behind the main hero image.]
- **Rendered DOM (Minimal):**

```html
<!-- Insert minimal outerHTML of the broken parent node here -->
```

- **Computed Styles:**

```css
/* Insert relevant properties from DevTools: z-index, position, display, etc. */
```

## 3. Expected Behavior (Target)

- **Structural Goal:** [e.g., The dropdown menu must render on top of all page content and span 100% of the viewport width.]

## 4. Constraints & Technical Requirements

- [e.g., Use existing Tailwind utility classes; do not write custom CSS.]
- [e.g., Do not alter the z-index of the hero component to fix this; isolate the fix to the Navigation component.]
- [e.g., Maintain existing TypeScript interfaces.]

### Execution Strategy for Aider

1. **Pre-load Context:** Execute `/add [files]` using the exact files listed in Section 1 before pasting the template. If you rely on Aider to find the files, you waste tokens and increase the risk of the agent modifying the wrong component.
2. **Atomic Prompting:** Paste the completed template as a single prompt.
3. **Constraint Enforcement:** The "Constraints" section is critical. AI agents naturally gravitate toward the path of least resistance, which often means modifying global layouts to fix local bugs. Explicit constraints force the agent to solve the problem at the correct abstraction layer.
