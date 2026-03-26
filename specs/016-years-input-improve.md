# Aider Specification: Refactor `YearsInput` Component

## Target Component

- [`YearsInput`](../src/app/components/contribute2/years-input.tsx)
- [`years-input.module.css`](../src/app/components/contribute2/years-input.module.css)

## Objective

Refactor `YearsInput.tsx` to improve input validation, state synchronization, and accessibility while maintaining the existing CSS theme.

### 1. Logic & Validation Improvements

- **Decouple Parsing**: Move the string-to-range parsing into a dedicated utility function.
- **Regex Refinement**: Use a regex that allows for flexible whitespace (e.g., `2020 - 2022`).
- **Validation Rules**:
  - A single year must be 4 digits.
  - A range must satisfy $start \le end$.
  - Invalid formats or logical errors (e.g., $1900-1850$) must not update the parent `react-hook-form` state with valid data.
- **State Handling**:
  - Maintain the local `inputValue` for a fluid typing experience.
  - Only call `onChange` (parent state) when the input matches a valid `[number]` or `[number, number]` pattern.
  - If the input is cleared, call `onChange(null)`.

### 2. Component Refactoring

- **Error State**: Introduce a local `isInvalid` state to trigger visual cues when the pattern or logic fails.
- **Accessibility**:
  - Add `aria-invalid` attribute to the input.
  - Include a hidden or conditional `span` for error messages tied to the input via `aria-describedby`.
- **Optimization**: Ensure `useCallback` is used correctly for the handler to prevent unnecessary re-renders of the `Controller`.

### 3. Technical Requirements

- **File**: `src/components/YearsInput/YearsInput.tsx` (adjust path as needed).
- **Type Safety**: Maintain `ControllerRenderProps` compatibility.
- **Input Masking (Optional/Suggested)**: Implement a basic mask or prevent non-numeric/non-hyphen characters to reduce input errors.

---

## Implementation Instructions for Aider

1. **Extract Utility**: Create `parseYearRange(input: string): number[] | null`.
   - Input: `"1920-1930"` -> Output: `[1920, 1930]`
   - Input: `"1920"` -> Output: `[1920]`
   - Return `null` if the input is malformed or $start > end$.
2. **Rewrite `handleChange`**:
   - Update `inputValue` state immediately.
   - Call `parseYearRange`.
   - If result is not null, call `onChange(result)`.
   - If input is empty, call `onChange(null)`.
3. **Update UI**:
   - Add a focused error message below the input if the user blurs the field with an invalid format.
   - Apply a `border-color: #dc2626` (or similar red) to `.input` when `isInvalid` is true.
