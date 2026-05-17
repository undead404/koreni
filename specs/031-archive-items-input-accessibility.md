# Task: Improve `ArchiveItemsInput` Accessibility and UX

## Context

The `ArchiveItemsInput` component currently requires users to press `Enter` or `,` to commit a typed archive item code into the tags array. If a user types a code and clicks away or tries to proceed to the next step without committing the code, the pending text in the input is not saved, the field is considered empty, and the user is stuck and confused.

## Requirements

Modify `src/app/components/contribute/archive-items-input.tsx` to implement the following behavior changes:

### 1. Commit on Blur

- Add an `onBlur` event handler to the text `<input>`.
- When the input loses focus, check if `tagInput.trim()` is not empty.
- If it contains text, automatically commit the value by calling `handleAdd(tagInput)`.

### 2. Add an Explicit Action Button

- Add a visible "Додати" button immediately next to or inside the text `<input>`.
- The button should only be visible or enabled when `tagInput.trim()` is not empty.
- Clicking the button must call `handleAdd(tagInput)` and retain focus on the input to allow rapid sequential entries.
- Ensure the button has an appropriate `aria-label` (e.g., "Додати архівну справу").

### 3. Prevent Form Submission on Enter

- Ensure that pressing `Enter` inside the input does not accidentally trigger the parent form's submission (the `event.preventDefault()` in `handleKeyDown` currently handles this, but verify it remains intact).

## Implementation Details

- In the `onBlur` handler, ensure you do not interfere with the `handleRemove` clicks (e.g., if a user clicks the "X" on a tag, the blur event fires before the click. You may need to safely handle the order of operations or rely on React's synthetic event batching).
- Update `src/app/components/contribute/archive-items-input.module.css` to accommodate the new "Додати" button within the `tagsWrap` container without breaking the flex/grid layout of existing tags.
