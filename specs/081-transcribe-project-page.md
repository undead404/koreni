---
description: Create /transcribe/transcribe/?projectId=[projectId] page that fetches images, redirects to upload page if empty, and handles routing/race conditions safely.
targets:
  - src/app/transcribe/transcribe/page.tsx
  - src/app/transcribe/transcribe/page.module.css
  - src/app/transcribe/api/get-project-images.ts
context:
  - CONVENTIONS.md
  - src/app/transcribe/images/page.tsx
  - src/server/src/handlers/handle-project-images-list.ts
---

# Create Transcribe Project Page Specification

## 1. Context & Scope

- **Target Component:** `TranscribeProjectPage` in `src/app/transcribe/transcribe/page.tsx`
- **Related Files:**
  - `src/app/transcribe/transcribe/page.module.css` (for styles)
  - `src/app/transcribe/api/get-project-images.ts` (new frontend API client module)
  - `src/app/transcribe/schemata.ts` (for common schemas/types)
- **API Endpoint:** `/api/transcribe/project/[projectId]/images` (implemented under Zone B in `src/server/src/handlers/handle-project-images-list.ts`)

## 2. Current Behavior (Actual)

Currently, the path `/transcribe/transcribe` does not exist, and clicking on project items in `ProjectsList` links to a non-existent page.

## 3. Expected Behavior (Target)

### 3.1. API Fetcher: `src/app/transcribe/api/get-project-images.ts`

Implement a client-side fetch helper `getProjectImages` that:

- Calls the `/api/transcribe/project/[projectId]/images` endpoint.
- Uses `requestApi` to send the request securely with appropriate credentials and support abort signals.
- Returns the list of project images or throws an error on failure.

### 3.2. Page Component: `src/app/transcribe/transcribe/page.tsx`

- **Route:** `/transcribe/transcribe/?projectId=[projectId]`
- **Client Component:** Marked with `'use client'`.
- **Query Parameter Parsing:**
  - Retrieve the `projectId` search parameter using Next.js `useSearchParams`.
  - Validate the `projectId` against a Zod schema matching `/^[a-z0-9-]+$/i`.
  - If invalid/missing, redirect immediately to `/transcribe`.
- **Data Fetching & State:**
  - Maintain loading, error, and images state.
  - Fetch project images on mount/parameter change.
- **Race Condition Prevention & Cleanups:**
  - Ensure any in-flight requests are cancelled or ignored if the component unmounts or if the `projectId` changes before the fetch completes (e.g., by utilizing `AbortController` or local boolean flag in `useEffect`).
- **Conditional Redirection:**
  - If the fetch completes and the images list is empty (`images.length === 0`), redirect the user to `/transcribe/images/?projectId=[projectId]`.
  - If there are images, render a placeholder state (e.g., "Ready to transcribe [count] images") to prove the happy path is reached.
- **Error Handling:**
  - Display error feedback using `toast.error` or standard error layouts if the API request fails.

## 4. Constraints & Technical Requirements

- Follow **Zone A** frontend constraints.
- Avoid ESM strict `.js` imports for frontend files.
- Explicitly prevent routing race conditions when handling URL query parameters.
- Handle styling via CSS Modules in `src/app/transcribe/transcribe/page.module.css`.

## 5. Testing Directives

### Recommended Test File: `src/app/transcribe/transcribe/page.test.tsx`

Using Vitest and `@testing-library/react`, cover the following scenarios:

1. **Invalid/Missing Query Parameter:** Mock `useSearchParams` to return null or invalid `projectId`. Verify that `useRouter().push` is called to redirect to `/transcribe`.
2. **Empty Images List (Redirect Path):** Mock `getProjectImages` to return an empty array `[]`. Verify that the page redirects to `/transcribe/images/?projectId=[projectId]`.
3. **Non-Empty Images List (Success Path):** Mock `getProjectImages` to return a list of images. Verify that the loading screen clears and the component displays the success state/transcription UI.
4. **API Call Error:** Mock `getProjectImages` to throw an error. Verify that the error is handled gracefully and a toast/error indicator is shown.
5. **Race Condition Prevention:** Verify that if `projectId` changes while a request is in flight, the older response is ignored and does not trigger an incorrect redirect or state update.
