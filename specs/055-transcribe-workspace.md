---
description: Move /transcribe/transcribe page to /transcribe/workspace and refactor it into a 2-panel layout (split screen) featuring an image viewer placeholder on the left and an interactive tabular data entry table on the right.
targets:
  - src/app/transcribe/workspace/page.tsx
  - src/app/transcribe/workspace/page.module.css
  - src/app/transcribe/workspace/page.test.tsx
  - src/app/transcribe/components/projects-list.tsx
  - src/app/transcribe/components/projects-list.test.tsx
  - src/app/transcribe/transcribe/page.tsx (deleted)
  - src/app/transcribe/transcribe/page.module.css (deleted)
  - src/app/transcribe/transcribe/page.test.tsx (deleted)
context:
  - CONVENTIONS.md
  - src/app/transcribe/schemata.ts
---

# Transcribe Workspace Specification

## 1. Context & Scope

The current implementation of the individual project transcription screen is a basic placeholder route at `/transcribe/transcribe/?projectId=[projectId]` (located in `src/app/transcribe/transcribe/page.tsx`). To support actual data entry and a professional user experience, this view must be moved and elevated into a **Transcription Workspace** at `/transcribe/workspace/?projectId=[projectId]`.

The workspace will feature a side-by-side **2-panel split layout**:

1. **Left Panel (Image Viewer / Placeholder):** A visual area dedicated to rendering and examining the document image being transcribed.
2. **Right Panel (Tabular Data Entry):** A responsive, editable table grid where the user can input structured data directly extracted from the left image.

Additionally, links from the projects dashboard must be updated to target this new `/transcribe/workspace` route rather than the obsolete `/transcribe/transcribe` path.

---

## 2. Current Behavior vs. Target State

### Current Route Definition & Navigation

- `/transcribe/transcribe/?projectId=[projectId]`: Basic "ready to transcribe" announcement screen.
- `ProjectsList` component links each project to `/transcribe/transcribe/?projectId=${project.id}`.
- No editing capabilities or workspace-like layout is present.

### Target Route Definition & Navigation

- `/transcribe/workspace/?projectId=[projectId]`: Dual-pane production-ready workspace mapping to `src/app/transcribe/workspace/page.tsx`.
- `ProjectsList` component updated to link directly to `/transcribe/workspace/?projectId=${project.id}`.
- The entire `src/app/transcribe/transcribe/` directory is deleted, and files are moved/adapted to `src/app/transcribe/workspace/`.

---

## 3. Detailed Specifications

### 3.1. File Re-organization

- Rename/move:
  - `src/app/transcribe/transcribe/page.tsx` -> `src/app/transcribe/workspace/page.tsx`
  - `src/app/transcribe/transcribe/page.module.css` -> `src/app/transcribe/workspace/page.module.css`
  - `src/app/transcribe/transcribe/page.test.tsx` -> `src/app/transcribe/workspace/page.test.tsx`
- Ensure all relative imports inside these files are updated to match their new folder depth relative to other utilities.

### 3.2. Dashboard Route Updates (`src/app/transcribe/components/`)

#### A. `projects-list.tsx`

- Change the target path in the `<Link>` element to `/transcribe/workspace/`:

  ```tsx
  href={`/transcribe/workspace/?projectId=${project.id}`}
  ```

#### B. `projects-list.test.tsx`

- Update assertion paths to check that links point to `/transcribe/workspace?projectId=...` rather than `/transcribe/transcribe?projectId=...`.

---

### 3.3. Workspace Split-Pane Layout & State (`src/app/transcribe/workspace/`)

The page component `src/app/transcribe/workspace/page.tsx` will load the project images asynchronously using `getProjectImages` (reusing the existing validation and load logic).
Once images are fetched:

- If `images.length === 0`, redirect user to `/transcribe/project/?projectId=${projectId}`.
- If images are present, render the 2-panel workspace.

#### A. Layout Structure (`page.module.css` & `page.tsx`)

- Implement a split-pane flex or grid container:
  - Large Screens: 100vh viewport height, divided into a 2-column grid or flex container (`1fr 1fr` or `50vw 50vw` or balanced `flex: 1` columns) so that both panels are visible side-by-side.
  - Left and right panels must have independent vertical scrollbars (`overflow-y: auto`) to prevent UI scroll locking.
  - Respect existing CSS colors and dark mode variables (e.g. `--background`, `--foreground`, `--border`, etc.).

#### B. Left Panel: Image Viewer Placeholder

- A container card with a border representing the document viewer.
- Standard visual elements:
  - A container with a light background (and dark-adapted color in dark mode) displaying:
    - If a valid project image exists, a mock image card with details (or an actual image if possible). For the initial phase, a stylized visual placeholder box is acceptable.
    - Placeholder layout must display an icon (e.g., Lucide image icon or inline SVG), the file key/name if available (e.g. `images[0]?.storageKey`), and clear instruction text: _"Зображення для транскрибування (Панель перегляду)"_.
    - Simple zoom/navigation controls placeholders (mock Zoom In, Zoom Out, Reset buttons) for future enhancement.

#### C. Right Panel: Tabular Data Input Grid

- A functional table layout that allows keying in transcription data:
  - Renders an interactive `<table>` with the following initial columns:
    - **No.** (Row index, read-only)
    - **Прізвище** (Last Name, text input)
    - **Ім'я** (First Name, text input)
    - **Рік народження / Вік** (Year of birth / Age, text input)
    - **Примітки** (Notes, text input)
    - **Дії** (Actions, containing a delete button for that row)
  - **State Management**:
    - Manage table row data in a local state array:

      ```tsx
      interface TranscriptionRow {
        id: string;
        lastName: string;
        firstName: string;
        yearOrAge: string;
        notes: string;
      }
      ```

    - Provide an "Add Row" button (`Додати рядок`) to append a new empty row to the table.
    - Provide a delete button (`Видалити`) for each row to remove it from local state.

---

## 4. Constraints & Technical Requirements

- Strict adherence to **Zone A** constraints (Frontend/Next.js).
- Client component directive `'use client'` must be placed at the very top of `src/app/transcribe/workspace/page.tsx`.
- Localization: Render all UI texts and labels in Ukrainian (e.g., "Додати рядок", "Зберегти", "Дані успішно збережено!", "Зображення для транскрибування").
- Dark theme styling: All borders, input elements, backgrounds, and buttons in the workspace must support high-contrast dark mode styles via standard media queries or CSS custom properties.

---

## 5. Testing Directives

### 5.1. Workspace Page Tests (`src/app/transcribe/workspace/page.test.tsx`)

Port the existing test cases from `src/app/transcribe/transcribe/page.test.tsx` and extend them:

1. **Redirect on Empty Images:** Confirm user is redirected to `/transcribe/project/?projectId=...` if images list is empty.
2. **Split Panel Render:** Verify that when images exist, the split-screen panels (both image viewer placeholder and tabular input) are rendered.
3. **Table Operations:**
   - Verify clicking "Додати рядок" appends a new row to the table.
   - Verify input fields update local row state on change.
   - Verify clicking "Видалити" removes a row from the table.

### 5.2. Compilation & Verification

Run compilation checks and unit tests to ensure zero issues:

```bash
yarn exec tsc --noEmit
yarn exec vitest src/app/transcribe/workspace/page.test.tsx src/app/transcribe/components/projects-list.test.tsx
```
