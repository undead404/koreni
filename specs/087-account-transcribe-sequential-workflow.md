---
description: Replace the redundant transcription readiness route with a gated project workflow for metadata, assets, workspace, and operations.
status: implementation-ready
targets:
  - src/app/account/transcribe/components/projects-list.tsx
  - src/app/account/transcribe/components/projects-list.test.tsx
  - src/app/account/transcribe/project/page.tsx
  - src/app/account/transcribe/project/page.module.css
  - src/app/account/transcribe/project/page.test.tsx
  - src/app/account/transcribe/transcribe/page.tsx
  - src/app/account/transcribe/transcribe/page.module.css
  - src/app/account/transcribe/transcribe/page.test.tsx
  - src/app/account/schemata.ts
  - src/server/src/database/get-project-images.ts
  - src/server/src/handlers/handle-project-images-list.test.ts
context:
  - CONVENTIONS.md
  - TESTING_CONVENTIONS.md
  - src/server/CONVENTIONS.md
  - src/server/TESTING_CONVENTIONS.md
  - src/app/account/transcribe/api/get-project.ts
  - src/app/account/transcribe/api/get-project-images.ts
  - src/app/account/transcribe/api/update-project.ts
  - src/server/src/database/schema.sql
  - src/server/src/database/generated.ts
  - src/server/src/handlers/handle-project-images-list.ts
---

# Sequential Account Transcription Workflow

<Architecture>

## Boundary and zones

- The project-management UI is Zone A: Next.js App Router, React 19, TypeScript, client components where `useState`, `useEffect`, `useSearchParams`, or event handlers require them.
- The image-list response extension is Zone B: Node.js 22, Hono, Kysely, strict ESM imports with `.js` on every local import.
- No database schema migration is required. `project_images.transcription` already exists and is nullable text.
- No transcription mutation or Operations API is added by this change.

## Canonical routing

### `src/app/account/transcribe/components/projects-list.tsx`

Change every project link to the canonical project-management route:

`/account/transcribe/project/?projectId=${project.id}`

Use the existing declarative `next/link` pattern. Do not route project-list navigation through `useRouter`.

### `src/app/account/transcribe/transcribe/page.tsx`

Replace the readiness UI and image-fetching behavior with a compatibility redirect:

- Parse and validate `projectId` with the existing project-id schema.
- For a valid ID, navigate to `/account/transcribe/project/?projectId=${projectId}`.
- For a missing or invalid ID, preserve the existing redirect to `/account/transcribe`.
- Do not fetch project images from this route.
- Do not render the old “Готовність до транскрибування” title or upload-only button.
- A temporary 404 from the future workspace route is acceptable and must not be intercepted here.

The existing `transcribe/page.module.css` and its test must be retained only if required by the compatibility page; remove obsolete readiness styles and assertions. Do not create a new page.

## Sequential project page

### `src/app/account/transcribe/project/page.tsx`

Preserve the existing Metadata, Asset Manager, and Operations tab structure. Add explicit workflow gating without adding a readiness page.

Use distinct state names for persisted project images and locally selected upload files; do not confuse the existing local `ImageFile[]` upload state with fetched `ProjectImage[]` records.

Required derived state:

- `metadataIsSaved`: true only after the project has loaded as valid project metadata or a metadata update succeeds; false while metadata is invalid or an update fails.
- `existingImagesCount`: the length of the fetched project-image list.
- `hasTranscriptionResult`: true when at least one fetched project image has a `transcription` value whose trimmed length is greater than zero.
- `canEnterWorkspace`: `metadataIsSaved && existingImagesCount > 0`.
- `canOpenOperations`: `metadataIsSaved && existingImagesCount > 0 && hasTranscriptionResult`.

The initial active tab remains `metadata`.

### Metadata tab

- Continue using `projectCreatePayloadSchema` through the existing `react-hook-form` resolver.
- Keep the project ID read-only.
- A successful `updateProject` call marks metadata saved and shows the existing success toast.
- Validation or update failure leaves later stages locked and shows an error toast.

### Asset Manager tab

- It is available only when `metadataIsSaved` is true.
- If a user attempts to open it before metadata is saved, keep Metadata active and call `toast.error` with a Ukrainian explanation.
- Preserve existing file selection, object-URL cleanup, upload abort, per-file status, and image-count refresh behavior.
- After a successful image refresh, replace the fetched persisted-image state so workspace and Operations gates use current data.

### Workspace CTA

- Render an active `next/link` to `/account/transcribe/workspace/?projectId=${projectId}` when `canEnterWorkspace` is true.
- It is acceptable for this link to produce a temporary 404 because the workspace route is not implemented yet.
- Before `canEnterWorkspace` is true, render a disabled control rather than an active link.
- The disabled control must not attempt navigation; if a guarded interaction is possible, show a toast.

### Operations tab

- It is available only when `canOpenOperations` is true.
- With no saved nonempty transcription result, keep Metadata or Asset Manager active and show a toast when Operations is attempted.
- Once available, preserve the existing placeholder Operations content. Do not imply that export or background operation APIs exist.

### `src/app/account/transcribe/project/page.module.css`

- Add disabled and gated-tab styling without changing the existing project-page layout unnecessarily.
- Preserve accessible contrast in light and dark themes.
- Do not style a new readiness panel or status page.

## API and response contract

### `src/server/src/database/get-project-images.ts`

Extend the existing selected fields with `transcription` mapped to the existing camelCase API field. Do not select or expose unrelated database columns.

### `src/app/account/schemata.ts`

Extend `projectImageSchema` with required response property `transcription: z.string().nullable()`. The Zone B query must always emit the property, using `null` when no transcription is saved. The inferred `ProjectImage` type must include this field. Do not use type assertions or `any` to bypass parsing.

### `src/app/account/transcribe/api/get-project-images.ts`

Keep the existing request and Zod parsing boundary. The returned parsed images must carry `transcription` to the project page.

### `src/server/src/handlers/handle-project-images-list.test.ts`

Update the mocked successful image payloads and exact response assertions to include `transcription: null` and a nonempty transcription case.

</Architecture>

<DataFlow>

## Initial load

1. The project page validates `projectId`.
2. It requests project metadata and project images through the existing frontend API helpers.
3. The metadata response is parsed with the existing project contract.
4. The image response is parsed with the extended `projectImageSchema`.
5. The form is reset from the loaded project metadata.
6. The fetched image list is stored separately from local pending upload files.
7. The page derives `existingImagesCount` and `hasTranscriptionResult`.
8. Metadata is active; Asset Manager and Operations are gated according to the derived state.

## Metadata mutation

1. The user submits the Metadata form.
2. `react-hook-form` validates with `projectCreatePayloadSchema`.
3. Invalid data does not call the API, leaves the Metadata tab active, and calls `toast.error`.
4. Valid data calls the existing `updateProject(projectId, payload)` helper.
5. On success, `metadataIsSaved` becomes true and a success toast is shown.
6. On failure, `metadataIsSaved` remains false and an error toast is shown.

## Asset transition

1. If metadata is not saved, selecting Asset Manager is rejected with a toast.
2. If metadata is saved, Asset Manager becomes active.
3. Existing local upload state handles selected files and upload cancellation.
4. After upload completion, `getProjectImages(projectId)` refreshes persisted images.
5. The refreshed list updates image count and transcription-derived gating.

## Workspace transition

1. Metadata saved plus one or more persisted images makes the Workspace link active.
2. Activating the link navigates directly to `/account/transcribe/workspace/?projectId=...`.
3. No frontend fallback is required if the route returns 404.

## Operations transition

1. Every refreshed persisted image is inspected.
2. `hasTranscriptionResult` is true if any `transcription` is non-null and `transcription.trim().length > 0`.
3. Operations is blocked until that condition is true.
4. Once true, the Operations tab can display its existing placeholder.
5. No operation is submitted or persisted by this specification.

## Compatibility transition

1. A valid visit to `/account/transcribe/transcribe/?projectId=...` navigates to the canonical project route.
2. An invalid or missing ID navigates to `/account/transcribe`.
3. No images request occurs on the compatibility route.

</DataFlow>

<FailureModes>

- **Missing or invalid project ID:** Redirect to `/account/transcribe`; do not call project or image APIs.
- **Project metadata load failure:** Show a toast and retain the existing loading/error recovery behavior; never unlock later stages based on stale or absent metadata.
- **Image-list load failure:** Show a toast; treat image count and transcription state as unavailable/locked.
- **Metadata validation failure:** Do not mutate the API, keep Metadata active, and show the validation error through a toast.
- **Metadata update failure:** Keep `metadataIsSaved` false, keep downstream stages locked, and show a toast.
- **Asset Manager before metadata save:** Do not switch tabs; show a toast explaining that metadata must be saved first.
- **Zero images:** Workspace remains a disabled control; Operations remains locked.
- **Images without transcription:** Workspace may be active, but Operations remains locked.
- **Empty transcription:** `null`, `''`, and whitespace-only strings do not unlock Operations.
- **One nonempty transcription:** Any trimmed nonempty transcription unlocks Operations, regardless of which image contains it.
- **Upload refresh failure:** Preserve the local upload result, show a toast, and do not infer new persisted image or transcription state.
- **Aborted upload/request:** Ignore abort errors and prevent stale state or navigation updates.
- **Project ID changes during requests:** Abort or ignore the old request; the old project must not unlock tabs or overwrite the new project state.
- **Workspace 404:** Allow the browser/router to surface the temporary 404; do not convert it into a misleading readiness message.
- **Malformed image response:** Zod parsing must fail at the API boundary; do not use a type assertion or default malformed transcription data into an unlocked state.
- **Backend image-list failure:** Preserve the existing 500 response and error contract.
- **Backend type rules:** Zone B local imports must use `.js`; no `any`, weakened schema, or unrelated database columns may be introduced.
- **Accessibility:** Gated controls must expose disabled state where applicable, and tabs must remain keyboard-operable with clear accessible names.

</FailureModes>

<TestPlan>

## Frontend test files

### `src/app/account/transcribe/project/page.test.tsx`

Mock boundaries:

- `next/navigation` hooks.
- `getProject`.
- `getProjectImages`.
- `getProjectSchemas`.
- `updateProject`.
- `saveProjectImage`.
- `sonner` toast methods.
- Existing form input components, as already done in the file.

Required assertions:

1. Metadata is the initial active tab.
2. Invalid metadata does not call `updateProject`, keeps downstream stages locked, and calls `toast.error`.
3. Failed `updateProject` keeps downstream stages locked and calls `toast.error`.
4. Asset Manager cannot be entered before metadata is successfully saved.
5. Zero images render a disabled Workspace control.
6. Saved metadata plus at least one image renders an active link with the exact workspace URL.
7. Images with `transcription: null`, `''`, or whitespace keep Operations unavailable.
8. At least one image with a trimmed nonempty transcription makes Operations available.
9. Refreshing image data updates both image count and Operations availability.
10. Existing tab and upload behavior remains intact.

### `src/app/account/transcribe/transcribe/page.test.tsx`

Mock boundaries:

- `next/navigation` hooks.
- No `getProjectImages` mock should be needed because this compatibility route must not fetch images.

Required assertions:

1. A valid project ID redirects to `/account/transcribe/project/?projectId=...`.
2. A missing project ID redirects to `/account/transcribe`.
3. An invalid project ID redirects to `/account/transcribe`.
4. The old readiness title and upload-only button are absent.
5. `getProjectImages` is not called.

### `src/app/account/transcribe/components/projects-list.test.tsx`

Mock boundaries:

- Existing project API/request boundary.
- Render the actual `next/link` behavior used by the component.

Required assertions:

1. A project link has the exact canonical project-page URL.
2. No project link targets `/account/transcribe/transcribe`.

## Backend test file

### `src/server/src/handlers/handle-project-images-list.test.ts`

Mock boundaries:

- Mock `getProjectImages` only.
- Do not call the real database.

Required assertions:

1. Successful image responses include `transcription: null` when absent.
2. Successful image responses preserve a nonempty transcription string.
3. The handler still returns an empty image list unchanged.
4. Missing `projectId` still returns 400.
5. Database failure still returns the existing 500 error contract.

## Verification

Run the targeted frontend and backend tests plus type checks. The implementation must also satisfy the repository’s MSW/network isolation and strict TypeScript conventions.

</TestPlan>
