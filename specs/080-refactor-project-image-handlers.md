---
description: Refactor project image handlers into separate CRUD modules and add an endpoint to list all project images.
targets:
  - src/server/src/app.ts
  - src/server/src/database/get-project-images.ts
  - src/server/src/handlers/handle-project-image-put.ts
  - src/server/src/handlers/handle-project-image-delete.ts
  - src/server/src/handlers/handle-project-image-get.ts
  - src/server/src/handlers/handle-project-images-list.ts
  - src/server/src/handlers/handle-project-image-put.test.ts
  - src/server/src/handlers/handle-project-image-delete.test.ts
  - src/server/src/handlers/handle-project-image-get.test.ts
  - src/server/src/handlers/handle-project-images-list.test.ts
context:
  - src/server/CONVENTIONS.md
  - src/server/TESTING_CONVENTIONS.md
---

# Project Image Handler Refactoring Specification

## 1. Context & Scope

Currently, the route handlers for project images are bundled across two main handler modules:

- `src/server/src/handlers/handle-project-image.ts`: Handles both `PUT` (image upload and database record creation) and `DELETE` (deleting R2 storage object and database record).
- `src/server/src/handlers/handle-project-images.ts`: Handles a single `GET` operation (retrieving a single image metadata by `imageId`).

This specification outlines the process of refactoring these endpoints so that each handler module corresponds to exactly one CRUD operation, and introduces a new handler to list all available images in a project under `GET /api/transcribe/projects/:projectId/images` (or `/api/transcribe/project/:projectId/images` for routing flexibility).

## 2. Current Behavior vs. Target Refactored State

### Current Route Definitions

- `PUT /api/transcribe/projects/:projectId/images/:imageId` -> `handleProjectImage`
- `DELETE /api/transcribe/projects/:projectId/images/:imageId` -> `handleProjectImage`
- `GET /api/transcribe/projects/:projectId/images/:imageId` -> `handleProjectImages`

### Target Refactored State Route Definitions

- `PUT /api/transcribe/projects/:projectId/images/:imageId` -> `handleProjectImagePut` (new)
- `DELETE /api/transcribe/projects/:projectId/images/:imageId` -> `handleProjectImageDelete` (new)
- `GET /api/transcribe/projects/:projectId/images/:imageId` -> `handleProjectImageGet` (new)
- `GET /api/transcribe/projects/:projectId/images` (and optionally `/api/transcribe/project/:projectId/images`) -> `handleProjectImagesList` (new)

The old files `handle-project-image.ts` and `handle-project-images.ts` will be safely removed.

---

## 3. Detailed Specifications

### 3.1. Database Layer (`src/server/src/database/get-project-images.ts`)

Create a new lightweight Kysely database helper to list all images in a project:

- **Input:** `projectId: string`
- **Logic:**

  ```ts
  import database from './client.js';

  export function getProjectImages(projectId: string) {
    return database
      .selectFrom('project_images')
      .select([
        'id',
        'project_id as projectId',
        'storage_key as storageKey',
        'page_sequence as pageSequence',
        'page_name as pageName',
        'height',
        'width',
        'created_at as createdAt',
        'blurhash',
      ])
      .where('project_id', '=', projectId)
      .orderBy('page_sequence', 'asc')
      .execute();
  }
  ```

- **Conventions:** Ensure absolute conformance to Zone B local import rules: `import database from './client.js';` containing `.js` extension.

---

### 3.2. Refactoring Directives for Handlers

#### A. `handle-project-image-put.ts`

- **Module Path:** `src/server/src/handlers/handle-project-image-put.ts`
- **Responsibilities:**
  - Check presence of `projectId` and `imageId` params; return `400` if missing.
  - Parse body and extract metadata: `pageSequence` (coerced number), `pageName` (nullable/optional), `blurhash`, and the image file (supporting both `file` or `image` fields).
  - Perform Zod validation using existing schemas/rules (specifically verifying `isJpeg` check).
  - Read arrayBuffer, decode dimensions using `getJpegDimensions`.
  - Perform upload using `uploadProjectImageToR2`.
  - Store database entry using `createProjectImage`.
  - Return `200` JSON payload on success:
    ```json
    { "success": true, "key": "...", "url": "..." }
    ```
  - Gracefully catch and log errors to stderr, returning `500` status with `{ "error": "Failed to upload image" }`.

#### B. `handle-project-image-delete.ts`

- **Module Path:** `src/server/src/handlers/handle-project-image-delete.ts`
- **Responsibilities:**
  - Check presence of `projectId` and `imageId` params; return `400` if missing.
  - Find image record in Turso using `findProjectImage`. If not found, return `404` status with `{ "error": "Image record not found" }`.
  - Delete R2 storage object using `deleteImageFromR2(image.storage_key)`.
  - Delete Turso database record using `deleteProjectImage(projectId, imageId)`.
  - Return `200` JSON payload on success:
    ```json
    { "success": true }
    ```
  - Gracefully catch and log errors to stderr, returning `500` status with `{ "error": "Failed to delete image" }`.

#### C. `handle-project-image-get.ts`

- **Module Path:** `src/server/src/handlers/handle-project-image-get.ts`
- **Responsibilities:**
  - Check presence of `projectId` and `imageId` params; return `400` if missing.
  - Find image record in Turso using `findProjectImage`. If not found, return `404` status with `{ "error": "Image not found" }`.
  - Return `200` JSON payload on success with mapped database snake_case fields to camelCase:
    ```json
    {
      "success": true,
      "image": {
        "id": "...",
        "projectId": "...",
        "storageKey": "...",
        "pageSequence": 0,
        "pageName": "...",
        "height": 0,
        "width": 0,
        "createdAt": 0,
        "blurhash": "..."
      }
    }
    ```
  - Gracefully catch and log errors to stderr, returning `500` status with `{ "error": "Failed to retrieve image" }`.

#### D. `handle-project-images-list.ts`

- **Module Path:** `src/server/src/handlers/handle-project-images-list.ts`
- **Responsibilities:**
  - Check presence of `projectId` parameter; return `400` if missing.
  - Query DB using `getProjectImages(projectId)`.
  - Return `200` JSON payload with the list of images:
    ```json
    {
      "success": true,
      "images": [
        {
          "id": "...",
          "projectId": "...",
          "storageKey": "...",
          "pageSequence": 1,
          "pageName": "...",
          "height": 0,
          "width": 0,
          "createdAt": 0,
          "blurhash": "..."
        }
      ]
    }
    ```
  - Gracefully catch and log errors to stderr, returning `500` status with `{ "error": "Failed to list project images" }`.

---

### 3.3. Route Configuration (`src/server/src/app.ts`)

- Remove imports for `handleProjectImage` and `handleProjectImages`.
- Import the 4 new handler modules using strict ESM `.js` naming convention:
  - `import handleProjectImagePut from './handlers/handle-project-image-put.js';`
  - `import handleProjectImageDelete from './handlers/handle-project-image-delete.js';`
  - `import handleProjectImageGet from './handlers/handle-project-image-get.js';`
  - `import handleProjectImagesList from './handlers/handle-project-images-list.js';`
- Mount the routes precisely inside `createApp()`:
  ```ts
  app.put(
    '/api/transcribe/projects/:projectId/images/:imageId',
    transcribeAuthMiddleware,
    handleProjectImagePut,
  );
  app.delete(
    '/api/transcribe/projects/:projectId/images/:imageId',
    transcribeAuthMiddleware,
    handleProjectImageDelete,
  );
  app.get(
    '/api/transcribe/projects/:projectId/images/:imageId',
    transcribeAuthMiddleware,
    handleProjectImageGet,
  );
  app.get(
    '/api/transcribe/projects/:projectId/images',
    transcribeAuthMiddleware,
    handleProjectImagesList,
  );
  // Optional flexibility mapping for direct project parameter singular alias
  app.get(
    '/api/transcribe/project/:projectId/images',
    transcribeAuthMiddleware,
    handleProjectImagesList,
  );
  ```

---

## 4. Testing Directives

### 4.1. Unit Testing Setup & Mocking Constraints

As per `TESTING_CONVENTIONS.md`, all tests must run 100% offline. Every service and external utility must be tightly stubbed.

In each test module under `src/server/src/handlers/`, implement isolated mock suites for the route handlers. Avoid actual DB or R2 network interaction.

#### Mocks Checklist

1. **Turso DB client**: Mock database imports or helper files under `../database/` to return deterministic mock values.
2. **R2 Service**: Mock `uploadProjectImageToR2` and `deleteImageFromR2` from `../services/r2.js`.
3. **JPEG dimensions helper**: Mock `getJpegDimensions` from `../helpers/get-jpeg-dimensions.js`.
4. **Environment**: Stub standard config environment parameters.
5. **Session / Middleware**: Bypass or mock `transcribeAuthMiddleware` / `verifyToken` to cleanly pass testing contexts.

### 4.2. Testing Scenarios to Implement

#### A. `handle-project-image-put.test.ts`

- **Scenario 1: Happy Path** (Valid JPEG file, correct fields). Assert response is `200` JSON with the R2 key & URL, and database insertion is triggered.
- **Scenario 2: Validation Failure** (Missing file, missing blurhash, or invalid non-JPEG file). Assert response is `400` with descriptive error payload.
- **Scenario 3: Bad Dimensions** (Malformed JPEG throws in helper). Assert response is `400` with invalid JPEG message.
- **Scenario 4: Service Failure** (R2 upload throws error). Assert upload fails gracefully, returning `500`.

#### B. `handle-project-image-delete.test.ts`

- **Scenario 1: Happy Path** (Existing image ID). Assert R2 deletion is called, database deletion is called, and return status is `200` with `{ success: true }`.
- **Scenario 2: Image Not Found** (Database returns `null` for image). Assert response is `404` and no R2 deletion occurs.
- **Scenario 3: Generic Failure**. Assert that database or storage throws are caught, resulting in a `500` response.

#### C. `handle-project-image-get.test.ts`

- **Scenario 1: Happy Path** (Existing image metadata). Assert database is queried and return status is `200` with the mapped camelCase image properties.
- **Scenario 2: Image Not Found**. Assert return status is `404`.

#### D. `handle-project-images-list.test.ts`

- **Scenario 1: Happy Path** (Project has images). Assert database helper `getProjectImages` is called and returns `200` with the list.
- **Scenario 2: Empty List** (Project has no images). Assert returns `200` with empty `images: []` array.
- **Scenario 3: Missing projectId param**. Assert returns `400` validation error.
