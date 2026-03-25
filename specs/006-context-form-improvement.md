# Refactoring `ContextForm`

## Objective

Refactor [`ContextForm`](../src/app/components/contribute2/context-form.tsx) and [`ContextForm.module.css`](../src/app/components/contribute2/context-form.module.css) to improve accessibility, user experience, and code quality.

## 1. Logic Extraction

- **Create `useLocationSearch` hook:** Move all `locationQuery`, `filteredLocations`, and `autocomplete` logic into a custom hook.
- **Encapsulate Debouncing:** Use a standard debounce utility or a cleaner `useEffect` pattern to replace the current `setTimeout` nesting.
- **Title/ID Sync:** Move the slugification logic into a dedicated helper function called during `onChange` or via a more robust `useWatch` subscription to avoid "flicker" on mount.

## 2. UI/UX Improvements

- **Replace Selection Chip:** Remove the `selectedLocationCoords` absolute-positioned input hack. Replace it with a clear, read-only display of the coordinates and a separate hidden input for form submission if necessary.
- **Visual Hierarchy:**
  - Group "Core Metadata" (Title, ID).
  - Group "Temporal/Source Data" (Years, Archive, Sources).
  - Group "Spatial Data" (Location Search, Map).
- **Loading States:** Add a visual indicator (e.g., a spinner in the `Search` icon) when the `remote` search is active.

## 3. Accessibility (A11y)

- **Combobox Pattern:** Implement `aria-expanded`, `aria-autocomplete="list"`, and `role="listbox"` for the location dropdown.
- **Keyboard Navigation:** Ensure users can navigate dropdown results using arrow keys and select with "Enter".
- **Error Visibility:** Ensure `ErrorMessage` components are associated with inputs via `aria-describedby`.

## 4. CSS Refactoring

- **Eliminate Redundancy:** Remove redundant `flex-direction: column` declarations in media queries where it is already the default.
- **Clean up `selectedLocation`:** Remove the z-index hacks. Use a standard flexbox layout for the chip.
- **Consistent Spacing:** Use a consistent `gap` strategy across all `fieldGroup` containers.

## 5. Implementation Tasks

1. **Refactor `ContextForm.tsx`:**
   - Extract the location search logic to `use-location-search.ts`.
   - Simplify the rendering of the location selection UI.
2. **Update `context-form.module.css`:**
   - Refactor the `.selectedLocation` and `.selectedLocationCoords` classes to use standard positioning.
   - Improve the `.dropdown` styling for better contrast in dark mode.
3. **Functional Fixes:**
   - Ensure that clearing the location also resets the map view in `LocationPicker`.
   - Validate that the ID slugification only triggers if the ID field has not been manually edited by the user.
