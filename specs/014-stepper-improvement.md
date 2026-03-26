# Aider Specification: Refactor `ContributeFormStepper`

## Target component

- [`ContributeFormStepper`](../src/app/components/contribute2/stepper.tsx)
- [`stepper.module.css`](../src/app/components/contribute2/stepper.module.css)
- [`STEPS`](../src/app/components/contribute2/steps.tsx)
- [`StepStatus`](../src/app/components/contribute2/types.ts)
- [`ContributeFormStep`](../src/app/components/contribute2/step.tsx)
- [`useContributionStateStore`](../src/app/components/contribute2/contribution-state.ts)

## 1. Core Objectives

- **Decouple Navigation Logic:** Remove global event listeners. Centralize navigation within the existing Zustand stores or a dedicated state handler.
- **Eliminate Magic Numbers:** Replace `useState(4)` with a logic-driven initialization (e.g., start at 0 or the first invalid step).
- **Optimize Step Validation:** Refactor the error-monitoring `useEffect` to prevent unnecessary re-renders and potential jump-loops.
- **Simplify Component Logic:** Extract complex status calculations (`nextConnectorStatus`) into a memoized helper or the `ContributeFormStep` component itself.

---

## 2. Proposed Changes

### A. State & Initialization

- Change `activeIndex` initialization to `0`. If the intent is to show the summary immediately when data exists, derive this from `tableFileName` or a "ready for review" flag in the store.
- Move the logic of `handleGoToStep` into the `useTableStateStore`. The `ReviewSummary` should call a store action instead of dispatching a global event.

### B. Effect Refactoring

- **Validation Jump:** The current loop over `STEPS` inside `useEffect` runs on every error change. Optimize it using `useMemo` to find the first error index.
- **File Guard:** The `useEffect` checking for `tableFileName` is necessary but should be the primary driver for resetting the stepper, not a secondary fix for a hardcoded index.

### C. Logic Extraction

- The `nextConnectorStatus` calculation is too dense for the `map` function. Create a pure function `getConnectorStatus(index, activeIndex, allDone, totalSteps)` to handle this logic.
- Ensure `allDone` is strictly defined by the submission success (`prUrl`), not just the index exceeding length.

---

## 3. Implementation Instructions for Aider

1. **Modify `useTableStateStore` (or `contribution-state`):**
   - Add `activeIndex` and `setActiveIndex` to the store to centralize navigation.
   - Remove `globalThis.addEventListener` and `CustomEvent` logic.

2. **Refactor `ContributeFormStepper.tsx`:**
   - **Cleanup:** Remove `globalThis` listeners. Remove the hardcoded `useState(4)`.
   - **Logic:** Use `useMemo` to calculate `allDone` and the current validation state.
   - **Validation:** Replace the error-scanning `useEffect` with a more stable version that only moves the `activeIndex` forward if the current step is valid, or backward only on explicit user interaction.
   - **Accessibility:** Ensure `role="list"` and `aria-label` remain, but verify that `activeIndex` updates are announced to screen readers (e.g., using `aria-live` on the step container).

3. **Refactor `nextConnectorStatus`:**

   ```typescript
   // Example of cleaner logic to implement
   const getConnectorStatus = (index, active, isAllDone, total) => {
     if (index === total - 1) return isAllDone ? 'completed' : 'hidden';
     if (isAllDone || index < active) return 'completed';
     if (index === active) return 'active';
     return 'pending';
   };
   ```

## 4. Technical Constraints

- **Stay within `react-hook-form` context:** Do not move form values out of the provider.
- **Maintain Style Isolation:** Do not modify `stepper.module.css` unless required for the loader or error visibility.
- **Type Safety:** Maintain strict TypeScript types for `StepStatus` and `ContributeForm2Values`.
