# Aider Specification: Refactor `ContributeFormStep` for Clarity and Accessibility

The current implementation of `ContributeFormStep` suffers from excessive ternary logic for class assignments, hardcoded UI strings, and poor accessibility for screen readers. To improve user understanding and maintainability, the following refactoring is required.

## 1. Logic & Clean Code Improvements

- **Class Management:** Replace the manual ternary chains for `indicatorClass`, `connectorClass`, and `titleClass` with a mapping object or a utility like `clsx`/`tailwind-merge` if available.
- **Action Logic:** Abstract the button group into a sub-component or a render function to reduce the JSX depth in the main `return`.

## 2. Accessibility (A11y) Enhancements

- **Aria Roles:** Add `aria-current="step"` to the active step container.
- **Interactive Elements:** Ensure the "Completed" step title and indicator (buttons) have clear focus states.
- **Screen Reader Context:** Add hidden text to the indicator to specify the status (e.g., "Step 1: Completed", "Step 2: Current") instead of just relying on icons or numbers.
- **Keyboard Navigation:** Verify that `onActivate` is reachable via Tab for completed steps.

## 3. Visual & UX Refinements

- **Summary Structure:** The `summary` currently renders as a plain string. Modify the `StepDefinition` type and this component to support structured summaries (e.g., key-value pairs) for better readability.
- **Transition States:** Implement a subtle transition for the `connector` color change to match the `indicator` animation.
- **Loading State:** Provide a visual hint in the rail/indicator when `trigger(def.fields)` is processing validation.

---

## Implementation Tasks

### [`ContributeFormStep`](../src/app/components/contribute2/step.tsx)

- Refactor class selection logic using a mapping object:

  ```typescript
  const statusMap = {
    completed: styles.indicatorCompleted,
    active: styles.indicatorActive,
    pending: styles.indicatorPending,
  };
  const indicatorClass = statusMap[status];
  ```

- Wrap the content area in an `aria-live` region if validation errors need to be announced dynamically.
- Update the `handleContinue` logic to provide feedback (e.g., a "shaking" animation or focus on the first error) if `trigger` returns `false`.

### [`step.module.css`](../src/app/components/contribute2/step.module.css)

- Add a `focus-visible` state to `.indicator` and `.title` to ensure keyboard navigation is visible.
- Ensure the `slideDown` animation doesn't cause layout shifts in the `rail` (indicator alignment).

### [`StepDefinition`](../src/app/components/contribute2/types.ts)

- Update `StepDefinition` to include an optional `summaryTitle` or `summaryMetadata` field if complex summaries are needed.
