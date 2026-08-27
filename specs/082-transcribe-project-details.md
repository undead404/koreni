---
description: Refactor project images upload page into a tabbed project details page at /transcribe/project/?projectId=[projectId] with Metadata, Asset Manager, and Operations tabs, and a persistent "Enter Workspace" CTA.
targets:
  - src/app/transcribe/project/page.tsx
  - src/app/transcribe/project/page.module.css
  - src/app/transcribe/transcribe/page.tsx
  - src/app/transcribe/api/get-project.ts
  - src/app/transcribe/api/update-project.ts
  - src/server/src/database/find-project.ts
  - src/server/src/database/update-project.ts
  - src/server/src/handlers/handle-transcribe-project-get.ts
  - src/server/src/handlers/handle-transcribe-project-update.ts
  - src/server/src/app.ts
context:
  - CONVENTIONS.md
  - src/server/CONVENTIONS.md
  - src/app/transcribe/images/page.tsx
  - src/app/transcribe/create/page.tsx
  - src/server/src/schemata.ts
---

# Transcribe Project Details Page Specification

## 1. Context & Scope

The current implementation of the transcribe image upload screen exists at `/transcribe/images/?projectId=[projectId]` (defined in `src/app/transcribe/images/page.tsx`). As the platform expands, this upload view is being elevated into a comprehensive **Project Details / Settings Page** at `/transcribe/project/?projectId=[projectId]`.

This page will provide a 3-tab sub-interface:

1. **Metadata controller**: An edit interface for existing project details, matching the structure and validation of the creation form.
2. **Asset manager**: The existing project images upload and removal tile grid component.
3. **Operations**: A placeholder for exporting project transcription data.

A prominent, persistent Primary CTA button to **"Enter Workspace"** must always be visible. This CTA links to `/transcribe/workspace/?projectId=[projectId]` (which will be implemented in a subsequent phase) and must be disabled if the project does not have any uploaded images.

Additionally, this specification outlines the necessary backend additions required to support reading and writing individual project metadata safely under Zone B conventions.

---

## 2. Current Behavior vs. Target State

### Current Route Definition

- `/transcribe/images/?projectId=[projectId]`: Direct upload page mapping to `src/app/transcribe/images/page.tsx`.
- Missing capability to view or edit existing project properties once a project is created.
- In `src/app/transcribe/transcribe/page.tsx`, if no images are present, users are redirected to `/transcribe/images/?projectId=[projectId]`.

### Target Route Definition

- `/transcribe/project/?projectId=[projectId]`: Unified Project Management Center mapping to `src/app/transcribe/project/page.tsx`.
- In `src/app/transcribe/transcribe/page.tsx`, if no images are present, users are redirected to `/transcribe/project/?projectId=[projectId]`.
- Existing files `src/app/transcribe/images/page.tsx` and `src/app/transcribe/images/page.module.css` are removed/renamed to the new location.

---

## 3. Detailed Specifications

### 3.1. Database Layer (`src/server/src/database/`)

#### A. `find-project.ts`

Create a new file `src/server/src/database/find-project.ts`:

- **Functionality:** Fetches a single project's complete record by `id` and `userId` to ensure user-scoped access control.
- **Query Structure:**

  ```ts
  import database from './client.js';

  export default function findProject(projectId: string, userId: string) {
    return database
      .selectFrom('projects')
      .where('id', '=', projectId)
      .where('user_id', '=', userId)
      .selectAll()
      .executeTakeFirst();
  }
  ```

#### B. `update-project.ts`

Create a new file `src/server/src/database/update-project.ts`:

- **Functionality:** Updates the metadata fields of an existing project.
- **Query Structure:**

  ```ts
  import type { ProjectCreatePayload } from '../schemata.js';
  import database from './client.js';

  export default function updateProject(
    projectId: string,
    userId: string,
    projectData: Omit<ProjectCreatePayload, 'id'>,
  ) {
    return database
      .updateTable('projects')
      .set({
        title: projectData.title,
        type: projectData.type,
        is_handwritten: projectData.isHandwritten ? 1 : 0,
        latitude: projectData.location[0],
        longitude: projectData.location[1],
        locale: projectData.tableLocale,
        sources: JSON.stringify(projectData.sources),
        year_start: projectData.yearsRange[0],
        year_end: projectData.yearsRange[1] ?? projectData.yearsRange[0],
      })
      .where('id', '=', projectId)
      .where('user_id', '=', userId)
      .returning(['id', 'title', 'type'])
      .executeTakeFirst();
  }
  ```

---

### 3.2. Backend Endpoints & Handlers

#### A. `handle-transcribe-project-get.ts`

Create a new file `src/server/src/handlers/handle-transcribe-project-get.ts`:

- **Endpoint:** `GET /api/transcribe/projects/:projectId`
- **Controller Logic:**
  - Retrieve the `projectId` parameter from `c.req.param('projectId')`.
  - Query DB using `findProject(projectId, c.var.userId)`.
  - If not found, return `404` status with `{ "error": "Project not found" }`.
  - Translate database snake_case fields back into the camelCase `ProjectCreatePayload` schema expectations:
    - `isHandwritten: project.is_handwritten === 1`
    - `location: [project.latitude, project.longitude]`
    - `tableLocale: project.locale`
    - `yearsRange: project.year_start === project.year_end ? [project.year_start] : [project.year_start, project.year_end]`
    - `sources: JSON.parse(project.sources || '[]')`
  - Return `200` JSON payload:

    ```json
    {
      "success": true,
      "project": {
        "id": "project-id",
        "title": "Project Title",
        "type": "table",
        "isHandwritten": true,
        "location": [48.9, 24.5],
        "tableLocale": "uk",
        "yearsRange": [1850, 1900],
        "sources": ["Source A"]
      }
    }
    ```

#### B. `handle-transcribe-project-update.ts`

Create a new file `src/server/src/handlers/handle-transcribe-project-update.ts`:

- **Endpoint:** `PUT /api/transcribe/projects/:projectId`
- **Controller Logic:**
  - Retrieve the `projectId` parameter from `c.req.param('projectId')`.
  - Retrieve and parse the body using `projectCreatePayloadSchema.omit({ id: true })`.
  - If invalid, return `400` status with descriptive error details.
  - Call `updateProject(projectId, c.var.userId, parsed.data)`.
  - If not updated (e.g. project mismatch/not found), return `404` or `403`.
  - Return `200` status with `{ "success": true }`.

#### C. Route Configuration (`src/server/src/app.ts`)

Mount the new project metadata routes inside `createApp()`:

```ts
app.get(
  '/api/transcribe/projects/:projectId',
  transcribeAuthMiddleware,
  handleTranscribeProjectGet,
);
app.put(
  '/api/transcribe/projects/:projectId',
  transcribeAuthMiddleware,
  handleTranscribeProjectUpdate,
);
```

---

### 3.3. Frontend API Clients

#### A. `get-project.ts`

Create `src/app/transcribe/api/get-project.ts`:

- **Functionality:** Calls `GET /api/transcribe/projects/[projectId]` using `requestApi` and returns the mapped project metadata response.

#### B. `update-project.ts`

Create `src/app/transcribe/api/update-project.ts`:

- **Functionality:** Calls `PUT /api/transcribe/projects/[projectId]` using `requestApi` with the payload body, returning the parsed response.

---

### 3.4. Page Layout & Tabbed State (`src/app/transcribe/project/page.tsx`)

Implement `/transcribe/project/?projectId=[projectId]` route in Client Component:

- **Query Parameter Retrieval & Validation:**
  - Parse `projectId` parameter from URL with Zod constraint. If invalid/missing, redirect to `/transcribe`.
- **Primary Page Elements:**
  - **Header & Title Area:** Shows project title (loaded asynchronously) and metadata summary.
  - **Primary CTA Button ("Enter Workspace"):**
    - High contrast, prominent styling.
    - Directs user to `/transcribe/workspace/?projectId=[projectId]` (nonexistent path for now).
    - **Crucial Rule:** Must be disabled if the fetched image list has 0 images.
  - **Sub-navigation Tab bar:**
    - Tabs: **Metadata**, **Asset Manager**, **Operations**.
    - Maintained via component React state (e.g. `const [activeTab, setActiveTab] = useState<'metadata' | 'assets' | 'operations'>('metadata')`).
- **Tab Layout Content:**
  - **Tab 1: Metadata Controller:**
    - Loads existing settings from `getProject`.
    - Implements `react-hook-form` using schema-driven fields mirroring `src/app/transcribe/create/page.tsx`.
    - Imports and reuses existing inputs: `SpatialInput`, `YearsInput`, `SourcesInput`.
    - **Crucial Rule:** The Unique ID input (`id`) is rendered as disabled/read-only (not allowed to change project identifier).
    - Features a "Save Changes" submit button, triggering `updateProject` API helper and showing progress/success via `sonner` toasts.
  - **Tab 2: Asset Manager:**
    - Full porting of the existing logic from `ProjectImagesUploadPageContent` (currently in `src/app/transcribe/images/page.tsx`).
    - Handles local file selections, warnings (e.g. count > 100 images), image deletion/restoration, and interactive uploads to R2 with abort signals.
  - **Tab 3: Operations:**
    - An informational placeholder view indicating future capabilities (e.g. "Data Export Options").
    - Renders simple explanatory text stating: _"Future features will include data exports to CSV, JSON, and XML format."_
    - Includes disabled preview export buttons for visual completeness.

---

### 3.5. Page Redirect Adjustments (`src/app/transcribe/transcribe/page.tsx`)

- Locate references to the obsolete `/transcribe/images` path and replace with `/transcribe/project`:
  - Change line 65 redirection:

    ```ts
    router.push(`/transcribe/project/?projectId=${activeProjectId}`);
    ```

  - Change line 113 action:

    ```ts
    router.push(`/transcribe/project/?projectId=${projectId}`);
    ```

---

## 4. Constraints & Technical Requirements

- Follow **Zone A** frontend constraints for `src/app/transcribe/project/page.tsx` and related components (do not use strict ESM `.js` local imports, use appropriate Client Component directive `'use client'`).
- Follow **Zone B** backend constraints for DB query modules and Hono handlers (local imports must strictly include `.js` extension, e.g., `import database from './client.js'`).
- Ensure all styled elements in `src/app/transcribe/project/page.module.css` support dark mode via standard custom properties and/or media queries.
- Clean up references: completely remove the deprecated files `src/app/transcribe/images/page.tsx` and `src/app/transcribe/images/page.module.css`.

---

## 5. Testing Directives

### 5.1. Backend Handler Tests (`src/server/src/handlers/`)

#### A. `handle-transcribe-project-get.test.ts`

Cover the following test cases in Vitest:

1. **Happy Path:** Authorized request fetching an existing user-scoped project. Confirm `200` response returning mapped fields (e.g. `isHandwritten: true`, etc.).
2. **Access Control (404/403):** Request fetching a project that belongs to another user. Confirm the handler prevents disclosure and returns `404` or `403`.
3. **Missing Project (404):** Request fetching a non-existent projectId. Confirm `404` response.

#### B. `handle-transcribe-project-update.test.ts`

Cover the following test cases:

1. **Happy Path:** Valid schema update on existing project. Verify database update payload structure and returning `200` status.
2. **Validation Failure:** Sending invalid latitude/longitude or empty fields. Confirm status is `400` with validation tree context.

### 5.2. Frontend Page Tests (`src/app/transcribe/project/page.test.tsx`)

Using Vitest and `@testing-library/react`, cover the following:

1. **Redirect on Invalid Parameters:** Verify page redirects to `/transcribe` if `projectId` parameter is missing or syntactically invalid.
2. **CTA "Enter Workspace" Disabled State:**
   - Mock images fetch returning `[]`. Verify that "Enter Workspace" button has the `disabled` property/attribute.
3. **CTA "Enter Workspace" Enabled State:**
   - Mock images fetch returning non-empty list of images. Verify that "Enter Workspace" button is active and correctly references the target route `/transcribe/workspace/?projectId=...`.
4. **Tab Navigation:** Verify clicking different tabs switches the rendered sub-view cleanly (e.g. showing form inputs on "Metadata", showing image tile grid on "Asset Manager").
5. **Form Editing and Saving:** Mock a successful project update request. Fill out the Metadata form fields, click "Save Changes", and verify that `updateProject` API is called and a success toast is displayed.
