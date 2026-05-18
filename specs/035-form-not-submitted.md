# Form not submitted

Most likely, this happens due to the recent Turnstile integration changes.

## 1. Context & Scope

- **Target Module:** `src/app/components/contribute/use-submit-contribution.ts`
- **Related Files:** `src/app/components/contribute/step.tsx`, `src/app/components/contribute/contribute-form.tsx`
- **Trigger State:** form submission

## 2. Current Behavior (Actual)

- **Structural Issue:** Form not submitted, no request sent on form submission. Instead, the submission button is just having 'Подається...' text.

## 3. Expected Behavior (Target)

- **Structural Goal:** Form submitted, request sent on form submission.
