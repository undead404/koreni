# Task: Enhance SuccessPanel UX and State Management

## Target component

- [`SuccessPanel`](../src/app/components/contribute2/success-panel.tsx)
- [`success-panel.module.css`](../src/app/components/contribute2/success-panel.module.css)
- [`useContributionStateStore`](../src/app/components/contribute2/contribution-state.ts)
- [`useTableStateStore`](../src/app/components/contribute2/table-state.ts)

## Context

The `SuccessPanel` appears after a complex data contribution. Current UI is too generic and the reset logic is brittle.

## Requirements

### 1. Visual Hierarchy & Branding

- **Primary Action:** Style the `addAnotherBtn` as a high-contrast primary button.
- **Secondary Action:** Style the `prUrl` link as a ghost or outline button to distinguish it from the internal form action.
- **Process Visualization:** Replace the `sub` paragraph with a horizontal "Next Steps" stepper component showing three stages: `Submitted`, `Peer Review`, `Published`.

### 2. State Management Refactoring

- **Decoupling:** Move the logic within `handleReset` into a single `useResetContribution` hook or a centralized action in `useContributionStateStore`.
- **Consistency:** Ensure `resetTableState()` and `form.reset()` are synchronized within this central handler to prevent stale data on re-entry.

### 3. Component Content

- **Submission Summary:** Add a collapsible "View Submission Summary" section that displays a high-level overview of the `title` and number of rows contributed (from `table-state`).
- **Accessibility:** Ensure the animated checkmark has a visually hidden text label "Success" for screen readers.

### 4. Styling (CSS Modules)

- Refactor `success-panel.module.css` to remove duplicate properties between `.prLink` and `.addAnotherBtn`.
- Use a dedicated `.primaryAction` class for the reset button.
- Add a subtle background pattern or gradient to the `.wrapper` to distinguish the success state from standard form steps.

## Files to Modify

- `components/contribution/success-panel.tsx`
- `components/contribution/success-panel.module.css`
- `components/contribution/contribution-state.ts` (if moving reset logic)
