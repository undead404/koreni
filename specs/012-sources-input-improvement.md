# Specification: Refactor SourcesInput for Stability and UX

Refactor `SourcesInput.tsx` and its styles to improve performance, accessibility, and visual clarity.

## Target component

- [`SourcesInput`](../src/app/components/contribute2/sources-input.tsx)
- [`sources-input.module.css`](../src/app/components/contribute2/sources-input.module.css)

## 1. Core Logic Refactoring

- **Implement `useFieldArray`**: Replace manual `Controller` array manipulation with the `useFieldArray` hook from `react-hook-form`.
- **Stable Keys**: Use the `id` provided by `useFieldArray` as the `key` for mapped elements instead of `source.url`.
- **Method Usage**: Use `append` for adding new sources and `remove` for deleting them.

## 2. Accessibility & HTML Structure

- **Group Labeling**: Use a `<fieldset>` and `<legend>` (styled as the current label) to group the dynamic inputs.
- **Unique IDs**: Generate unique IDs for each input (e.g., `sources-input-${index}`) and link them to their respective labels or use `aria-label` if labels are hidden.
- **Error Descriptions**: Use `aria-invalid` and `aria-describedby` to link inputs to their specific `ErrorMessage` components.

## 3. UI/UX Improvements

- **Visual Cleanup**: Remove redundant borders. The `arrayInputRow` should act as the container; the inner `input` should have `border: none` and `background: transparent`.
- **Empty State**: Ensure the form starts with one empty field if `sources` is empty, or clearly style the "Add" button to look like a primary action when the list is empty.
- **Icon Alignment**: Center the `X` icon properly within the `removeButton`. Use a larger hit area for the button while keeping the icon small.

## 4. Technical Constraints

- **File**: `sources-input.tsx`
- **Styles**: Update `sources-input.module.css` to support the "borderless" inner input and focus-within states on the row.
- **Types**: Ensure `ContributeForm2Values` correctly reflects the array structure `{ url: string }[]`.

## 5. Validation

- Ensure the `ErrorMessage` for the entire array (e.g., "At least one source required") is displayed separately from individual URL syntax errors.
