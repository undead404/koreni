# Task: Refactor and Enhance ArchiveItemsInput

## Target component

- [ArchiveItemsInput](../src/app/components/contribute2/archive-items-input.tsx)
- [ArchiveItemsInput.module.css](../src/app/components/contribute2/archive-items-input.module.css)

## 1. Logic Refinement

- **Validation Engine:** Extract `UKR_ARCHIVE_REGEX` into a separate utility.
- **Input Behavior:**
  - Remove `onBlur={handleAdd}`. Replace with a "Натисніть Enter, щоб додати" message.
  - Prevent adding duplicate items (case-insensitive).
- **Live Validation:** Implement a visual indicator (e.g., border color change on the input) while the user is typing to show if the current string matches the standard format.

## 2. Component Refactoring

- **Focus Management:** After clicking the `X` remove button, programmatically return focus to the `tagInput`.
- **Optimization:** Use `useMemo` for the `hasSomeStandard` check and the mapping of tags to prevent unnecessary re-renders of the entire list.
- **State Management:** Ensure `tagInput` is cleared only upon a successful add.

## 3. UI/UX Enhancements

- **Max Height & Scroll:** Set a `max-height` on `.tagsWrap` and implement `overflow-y: auto` to prevent long lists from pushing the rest of the form off-screen.
- **Visual Feedback:** - Add a "skeleton" preview tag that appears faintly while typing, showing how the tag will look.
  - Improve the `.tagWarning` style: use a subtle orange background with a darker orange border for better contrast in both light and dark modes.
- **Iconography:** Use a smaller, more refined `AlertTriangle` inside the tag.

## 4. CSS Improvements

- **Flexbox Layout:** Ensure the `tagInput` always has a minimum width but expands to fill the remaining line.
- **Dark Mode:** - Fix `.tag` colors for dark mode; the current `#f1f5f9` background is too bright against dark backgrounds. Use a translucent `rgba` or a deeper slate.
  - Ensure the `.warningText` meets AA contrast ratios in dark mode.

## 5. Technical Requirements

- Maintain compatibility with `react-hook-form` `Controller`.
- Ensure all new interactive elements have appropriate accessible explaining text.
