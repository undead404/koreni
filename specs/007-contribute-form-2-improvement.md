# Aider Specification: Refactor & UX Enhancement for `ContributeForm2`

## Target component

- [`ContributeForm2`](../src/app/components/contribute2/contribute-form.tsx)
- [`useContributeForm`](../src/app/components/contribute2/use-contribute-form.ts)
- [`contribute-form.module.css`](../src/app/components/contribute2/contribute-form.module.css)
- [`useContributionStateStore`](../src/app/components/contribute2/contribution-state.ts)
- [`ContributeForm2Values`](../src/app/components/contribute2/types.ts)
- [`convertContributeFormData`](../src/app/components/contribute2/convert-contribute-form-data.ts)
- [`useTableStateStore`](../src/app/components/contribute2/table-state.ts)

## 1. Core Objectives

- **Contextual Error Handling:** Transition from global `toast` errors to field-level validation feedback within the `ContributeFormStepper`.
- **Submission Transparency:** Provide clear, non-blocking visual feedback during the "conversion" and "fetching" stages of the contribution.
- **Logic Decoupling:** Move the API submission and state orchestration into a dedicated hook to improve readability.

## 2. Technical Requirements

### 2.1. Refactor: Error Management

- **Remove:** The `useEffect` hook in `ContributeForm2.tsx` that iterates over `form.formState.errors` to trigger toasts.
- **Implementation:** Ensure `FormProvider` correctly propagates the `formState` so that individual components inside `ContributeFormStepper` can render errors using a standard `<ErrorMessage />` component or local CSS classes.
- **Critical:** Toasts should only be used for **global API errors** (e.g., 500 status codes, network failure), not for validation (e.g., missing fields).

### 2.2. Enhance: Submission Lifecycle

- **State Updates:** Update `useContributionStateStore` calls to include a "stage" or "progress" indicator.
  - _Stage 1:_ Data processing/Conversion (`convertContributeFormData`).
  - _Stage 2:_ Human verification (Turnstile).
  - _Stage 3:_ API Transmission.
- **UI Feedback:** Add a descriptive sub-text below the `h1.title` or within the `Loader` during submission that explains what is happening (e.g., "Завантажується...", "Зберігаємо дані...").

### 2.3. Logic Extraction: `useSubmitContribution`

- Create a custom hook `useSubmitContribution.ts` (or similar) to encapsulate the `submit` handler logic.
- **Inputs:** `form`, `turnstileToken`, `getTableAsObjects`, `getAllColumns`.
- **Outputs:** `handleSubmit` (the wrapped handler), `isSubmitting`, `error`.
- **Reasoning:** This reduces the `ContributeForm2` component by ~60 lines, making the entry point focused strictly on layout and context providers.

## 3. UI & CSS Updates

### 3.1. Field Clarity (`contribute-form.module.css`)

- **Validation States:** Add a `.inputError` class that applies a red border and a subtle light-red background.
- **Focus States:** Ensure `:focus-visible` is used for better accessibility compared to standard `:focus`.
- **Read-only clarity:** Enhance `.readonlyInput` to have a slightly more distinct background (`#f1f5f9` vs `#f8fafc`) to clearly differentiate it from interactive fields.

### 3.2. Stepper Integration

- Ensure the `ContributeFormStepper` receives a "locked" state when `contributionState.isSubmitting` is true to prevent users from navigating away or editing data during the fetch.

## 4. Implementation Checklist for Aider

- [ ] Move API submission logic from `ContributeForm2.tsx` to a new hook.
- [ ] Delete the error-toast `useEffect` in the main component.
- [ ] Implement inline error displays for fields (referencing `styles.error`).
- [ ] Update the `submit` function to handle `turnstile.reset()` more gracefully on specific validation errors.
- [ ] Ensure `posthog` events remain intact in the new hook.
