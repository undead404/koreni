# Refactoring Spec: AuthorForm Component

## Target Component

- [AuthorForm](../src/app/components/contribute2/author-form.tsx)
- [AuthorForm.module.css](../src/app/components/contribute2/author-form.module.css)

## 1. Problem Statement

`useFormContext` is called twice unnecessarily.

## 2. Requirements

### Logic Cleanup

- Consolidate the two `useFormContext` calls into one.
- Extract the icon logic so Lucide icons and the GitHub `Image` component are handled consistently as a `ReactNode`.

### Visual & UX Improvements

- Ensure the `hint` section at the bottom is semantically linked to the entire fieldset or the specific inputs if applicable.
- Maintain the existing CSS module class names for styling consistency.

## 3. Implementation Plan

### Step 1: Accessibility Audit

- Add `aria-describedby` to inputs pointing to the error message ID.
- Add `aria-invalid={!!errors[name]}` to the input.
