---
description: Deduplicate authenticated project and image requests on the account transcribe project page with SWR while preserving static export and existing API contracts.
targets:
  - package.json
  - src/app/account/layout.tsx
  - src/app/account/components/account-swr-provider.tsx
  - src/app/account/components/account-header.tsx
  - src/app/account/components/account-header.test.tsx
  - src/app/account/transcribe/project/page.tsx
  - src/app/account/transcribe/project/page.test.tsx
  - src/app/account/transcribe/api/get-project.ts
  - src/app/account/transcribe/api/get-project-images.ts
context:
  - CONVENTIONS.md
  - TESTING_CONVENTIONS.md
  - src/app/account/transcribe/schemata.ts
  - src/app/account/transcribe/api/request.ts
  - src/server/src/handlers/handle-transcribe-project-get.ts
  - src/server/src/handlers/handle-project-images-list.ts
---

# Transcribe SWR Request Deduplication Specification

## Scope and Boundaries

This is a Zone A frontend change. It applies to the static-exported account route:

`/account/transcribe/project/?projectId=[projectId]`

The implementation must use client-side SWR fetching after the statically generated page loads. It must not add server-side authenticated fetching, change the Next.js export configuration, or change Zone B files.

The following API contracts remain unchanged:

- `GET /api/transcribe/projects/:projectId`
- `GET /api/transcribe/project/:projectId/images`

The existing `getProject` and `getProjectImages` service functions remain the only API-request boundary. React components must not call `fetch` or `requestApi` directly.

<Architecture>

### Dependency and provider

1. Add `swr` to the root `package.json` dependencies. Lockfile handling is outside this specification and must follow repository policy.
2. Create the client component `src/app/account/components/account-swr-provider.tsx`.
3. The provider must render `SWRConfig` with the account policy:
   - `revalidateOnFocus: false`;
   - `revalidateOnReconnect: false`;
   - a finite `dedupingInterval` of 2 seconds unless an implementation review approves another value.
4. Wrap account-layout children with this provider in `src/app/account/layout.tsx`. The account layout remains a server component; only the provider is a client boundary.

### Shared project request

1. `src/app/account/components/account-header.tsx` must stop invoking `getProject` directly.
2. The header must use SWR with the exact key `/api/transcribe/projects/${projectId}` when the normalized pathname is `/account/transcribe/project` and a valid project ID exists.
3. The header must use a `null` SWR key for all other routes or invalid/missing project IDs.
4. The header must render the project title only when the returned project ID matches the current query parameter. It must not retain a title from a previous project ID.
5. `src/app/account/transcribe/project/page.tsx` must use the same exact project key and the existing `getProject` fetcher. It must not issue a separate manual project-loading effect.

### Shared images request

1. The project page must use SWR with the exact key `/api/transcribe/project/${projectId}/images`.
2. The existing `getProjectImages` fetcher and `projectImagesResponseSchema` remain responsible for HTTP and response validation.
3. Image loading must be enabled only after a valid project ID is available.
4. The page must derive `projectImages`, `existingImagesCount`, `isLoading`, and image-load failure state from the SWR result rather than maintaining a second fetch lifecycle for the same request.

### Existing page behavior

The following local UI state remains owned by `ProjectDetailsPage`:

- React Hook Form state;
- active tab;
- selected upload files and object URLs;
- upload progress/status;
- metadata submission status.

When SWR project data changes, the page must reset the form to the current project payload. It must not reset the form in response to an old project response.

The project page must preserve its current route validation and redirect to `/account/transcribe` for a missing or invalid `projectId`.

</Architecture>

<DataFlow>

### Initial project route

1. Next.js serves the statically exported account route.
2. The client derives and validates `projectId` from `useSearchParams`.
3. The account header and project page compute the same project SWR key.
4. SWR deduplicates concurrent consumers and calls `getProject(projectId)` once for the shared key.
5. The header reads `project.title` for breadcrumbs.
6. The page resets its form and metadata state from the same project response.

### Images

1. The page computes the image key only for a valid project ID.
2. SWR calls `getProjectImages(projectId)` and caches the result by key.
3. The page derives the image count and workspace availability from the cached image list.
4. A stale or superseded response must not update the active project state.

### Metadata mutation

1. The form submits through the existing `updateProject` API service.
2. On success, update or revalidate the project SWR key using SWR `mutate`.
3. The page must preserve the existing success toast and saved-state behavior.
4. On failure, retain the current form values and show the existing error toast without mutating cached project data.

### Image mutation

1. Existing upload and deletion operations remain sequential and use their current API services.
2. After successful upload or deletion, revalidate the exact image SWR key with `mutate`.
3. The refreshed list must update `existingImagesCount`, workspace gating, and transcription-result gating.
4. A refresh failure must preserve the last valid image list and show the existing refresh error behavior.

### Routing and identity transitions

When `projectId` changes:

1. The old project and image keys become inactive.
2. SWR must not display an old project title for the new ID.
3. Form reset and image-derived state must only use data associated with the new key.
4. A missing or invalid ID must not produce an API request and must retain the existing redirect.

</DataFlow>

<FailureModes>

- Missing or invalid `projectId`: use a `null` SWR key, redirect to `/account/transcribe`, and do not call either API service.
- Project HTTP 401, 403, or 404: expose the existing project error state; do not populate the form or breadcrumb with stale data.
- Project schema validation failure: treat it as a load failure and preserve the existing error presentation.
- Image HTTP failure: expose the existing project-details image/load failure behavior.
- Image schema validation failure: do not treat the response as an empty successful image list.
- SWR focus or reconnect revalidation: disabled by provider configuration.
- React Strict Mode effect replay: SWR must deduplicate the same key and the UI must commit one logical result.
- Project ID changes while requests are pending: stale responses must not overwrite the current title, form, image list, or counts.
- Aborted or superseded request: do not show a user-facing error toast for an expected cancellation.
- Metadata update failure: preserve form values, cached project data, and existing error feedback.
- Image mutation refresh failure: preserve the previous valid image list and report refresh failure without resetting unrelated page state.
- Cache contamination in tests: every test using SWR must use an isolated cache provider.
- The implementation must not weaken existing Zod types or make omitted API fields silently valid.

</FailureModes>

<TestPlan>

### `src/app/account/components/account-header.test.tsx`

Use an isolated SWR cache and MSW handlers. Do not spy on or mock global `fetch`.

Assert:

1. A valid project route renders the project title from the SWR response.
2. The header does not independently invoke `getProject` when the shared project data is available.
3. Missing and non-project routes do not issue a project request.
4. A project ID change does not retain the previous title.
5. The MSW request handler observes one logical project request for concurrent header/page consumers.

### `src/app/account/transcribe/project/page.test.tsx`

Use an isolated SWR cache, `next-router-mock`/approved navigation mocks, and MSW with `onUnhandledRequest: 'error'`.

Preserve existing assertions for metadata, tabs, uploads, workspace gating, and redirects. Add assertions that:

1. Project metadata and images render from SWR results.
2. The project page does not make a second project request when the header consumes the same key.
3. Repeated same-key consumers are deduplicated.
4. Invalid and missing IDs redirect without API calls.
5. A project ID transition ignores the old project and image responses.
6. Project mutation revalidates the project key.
7. Image upload/deletion revalidates the image key and updates the image count.
8. Expected cancellation does not display an error toast.
9. HTTP and schema failures display the existing error state.

### Provider coverage

If `account-swr-provider.tsx` contains only static configuration, cover it through the consumer tests. If it contains behavior, add `account-swr-provider.test.tsx` and assert the configured revalidation and deduplication policy.

### Verification commands

- `yarn vitest run src/app/account/components/account-header.test.tsx src/app/account/transcribe/project/page.test.tsx`
- `yarn typecheck`
- `yarn build`

</TestPlan>

## Acceptance Criteria

1. The account header and project page share one project response for the same project ID.
2. The project endpoint is not independently fetched by `AccountHeader`.
3. Strict Mode replay does not create duplicate logical state commits.
4. Image data is cached and revalidated through the image key.
5. Metadata and image mutations invalidate the correct SWR keys.
6. Static export remains functional; authenticated project data is fetched only in the browser.
7. Existing routes, API payloads, Zod validation, toasts, and access behavior remain unchanged.
8. All frontend tests use MSW for network boundaries and isolated SWR caches.
9. No Zone B source files are modified.

## Unresolved Prerequisites

1. Confirm that adding the `swr` dependency is approved for the root workspace.
2. Confirm the exact `dedupingInterval` expected by product/operations; 2 seconds is the proposed default.
3. Confirm whether focus/reconnect revalidation should remain disabled permanently for these authenticated project screens.
4. Confirm whether the existing test harness already exposes MSW setup; if not, establish the repository-approved MSW setup before implementation.
