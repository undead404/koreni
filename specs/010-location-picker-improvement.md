# Unified Specification: Spatial Data Refactor and UX Enhancement

## Target Component

- [`ContextForm`](../src/app/components/contribute2/context-form.tsx)
- [`useLocationSearch`](../src/app/components/contribute2/use-location-search.ts)
- [`useKnownLocations`](../src/app/components/contribute2/known-locations-context.ts)
- [`LocationPicker`](../src/app/components/contribute2/location-picker.tsx)
- [`MapUpdater`](../src/app/components/contribute2/map-updater.tsx)

## 1. Architectural Extraction: `SpatialInput` Component

Extract all spatial-related logic from `ContextForm` into a new, standalone `SpatialInput` component.

- **Encapsulation:** Move `useLocationSearch`, `showDropdown`, `focusedIndex`, and keyboard/click-outside listeners into `SpatialInput`.
- **Interface:** Export `SpatialInput` as a controlled component accepting `value` (string) and `onChange` (function).
- **Structure:** - **Left Column:** Search input, loading indicators, and the results dropdown.
  - **Right Column:** The `LocationPicker` map.
- **Form Integration:** Replace the ~70 lines of inline JSX in `ContextForm` with a single `<SpatialInput {...field} />` inside the `Controller`.

## 2. Refactor: `LocationPicker` (Map Logic)

Clean up the internal implementation of the map to prevent performance degradation and state desync.

- **Logic Consolidation:** Remove redundant `useEffect` and `useMemo` blocks. Use a single `useMemo` to parse the `value` prop into a coordinate tuple.
- **Interaction:**
  - Implement **Click-to-Set**: Allow users to click anywhere on the map to place/move the marker.
  - **Draggable Marker**: Ensure `dragend` correctly updates the parent `value`.
- **Utility:** Extract the `coordinatesStringAsTupleSchema` and parsing logic into a shared utility file (`/app/helpers/geo-utils.ts`) to avoid duplicate Zod schemas.

## 3. UX & State Synchronization

Fix the friction between searching and manual map selection.

- **Search/Map Sync:** When a user selects a result from the search dropdown, the map must center and zoom on those coordinates. When a user drags the marker, clear the search query or update it with a "Manual Pin" indicator to prevent the UI from showing an old address for new coordinates.
- **Automatic Metadata:** Extract the `title` to `id` (slug) synchronization into a custom hook `useFormAutoFill` within the form directory.
- **Visuals:** Ensure `styles.mapGrid` and layout consistency are preserved during the extraction. Use `lucide-react` icons consistently for Search, Pin, and Clear actions.

## 4. Technical Requirements

- **Performance:** Memoize the `Marker` component and the `SpatialInput` component to prevent the map from re-initializing when other form fields (like `title` or `yearsRange`) change.
- **Accessibility:** Ensure the search dropdown follows `aria-combobox` patterns, including correct `aria-expanded` states and keyboard navigation (Arrow keys + Enter).
- **Error Handling:** Gracefully handle malformed coordinate strings in the `value` prop without crashing the `MapContainer`.
