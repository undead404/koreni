---
description: Add a feature-gated link from the account overview to transcription projects.
status: implementation-ready
targets:
  - src/app/account/page.tsx
  - src/app/account/page.test.tsx
context:
  - src/app/environment.ts
  - src/app/account/transcribe/page.tsx
---

# Add Transcription Link to Account Overview

<Architecture>

## Boundary

- **Execution zone:** Zone A (Next.js App Router, React 19, TypeScript).
- **Primary route:** `/account/`.
- **Destination route:** `/account/transcribe/`.
- **Data scope:** N/A. This change adds navigation only; it does not fetch, mutate, or persist project data.
- **Zone B:** No backend files, routes, handlers, database queries, or server contracts may change.

## Exact files and operations

### `src/app/account/page.tsx`

1. Import the centralized `environment` object from `@/app/environment`.
2. Keep the existing `Link` import from `next/link`.
3. In the authenticated account card, add one conditional `Link` with:
   - `href="/account/transcribe"`;
   - visible label exactly `Транскрибування`;
   - rendering condition `environment.NEXT_PUBLIC_ENABLE_TRANSCRIBE === true`.
4. Place the link with the existing account actions, without replacing or changing the Karma link.
5. Preserve the current client component, authentication request, loading state, Zod parsing, and unauthenticated redirect.

### `src/app/account/page.test.tsx`

1. Mock `@/app/environment` with a mutable `NEXT_PUBLIC_ENABLE_TRANSCRIBE` value.
2. Add coverage for the enabled and disabled feature states.
3. Preserve the existing authentication and account-content assertions.

## Implementation patterns

- Use declarative Next.js `Link`; do not use `useRouter().push` for this navigation.
- Use the existing account card markup and CSS unless the implementation demonstrates that styling is required for an accessible visible link.
- Do not introduce a new component, schema, hook, API client, or state store.

</Architecture>

<DataFlow>

## Enabled state

1. `src/app/environment.ts` evaluates `NEXT_PUBLIC_ENABLE_TRANSCRIBE` as `true` only when the value is exactly the string `"true"`.
2. `AccountPage` authenticates as it does currently through `requestApi('/api/auth/me')`.
3. After `user` state is populated, the account card renders the `Транскрибування` link.
4. Next.js `Link` navigates to `/account/transcribe`.
5. The destination page independently checks the same feature flag and renders the existing transcription dashboard and `ProjectsList`.
6. `ProjectsList` remains the only component responsible for requesting and displaying saved projects.

## Disabled state

1. `environment.NEXT_PUBLIC_ENABLE_TRANSCRIBE` is false.
2. The account page renders its existing authenticated content but omits the `Транскрибування` link.
3. No new request, state transition, redirect, or backend mutation occurs.
4. Direct navigation to `/account/transcribe` remains governed by its existing `notFound()` behavior.

## Contract and mutation rules

- No API request is added to `/account/`.
- No project data is copied into account-page state.
- No URL query parameters or dynamic route segments are introduced.
- No backend authentication or project ownership contract changes.

</DataFlow>

<FailureModes>

- **Unset, empty, or differently cased flag:** Treat as disabled because the centralized environment object returns `false`; omit the link.
- **Feature disabled with direct destination visit:** Preserve `/account/transcribe/page.tsx` `notFound()` behavior; do not add a second redirect mechanism.
- **Unauthenticated account request:** Preserve the existing catch path and `router.replace('/account/login')`; the link must not render while the page is loading or after authentication failure.
- **Account API/schema failure:** Do not alter existing toast, error, or redirect behavior; this navigation change has no fallback API path.
- **Destination project-list failure or empty list:** Preserve existing `/account/transcribe` behavior. The account link only navigates and must not attempt to interpret project-list results.
- **Accessibility:** The link must have the visible text `Транскрибування` and be discoverable as a link by its accessible name.
- **Routing:** Use the exact path `/account/transcribe`, without a query string or client-side race-prone effect.
- **Type rules:** Do not use `any`, type assertions, or new unvalidated environment access. Do not add `.js` imports because this is Zone A.

</FailureModes>

<TestPlan>

## Exact test file

`src/app/account/page.test.tsx`

## Mock boundaries

- Mock `@/app/services/api` so `/api/auth/me` returns a valid `{ user: { email, id } }` response.
- Mock `@/app/environment` with `NEXT_PUBLIC_ENABLE_TRANSCRIBE: true` for the enabled case and mutate/reset that value for the disabled case.
- Retain the existing `next/navigation` mock for `useRouter().replace`.
- Do not call the real API, backend, database, or transcription page.

## Required assertions

1. With the feature enabled and an authenticated user:
   - wait for the account heading or identity to render;
   - find a link by role with accessible name `Транскрибування`;
   - assert its `href` is `/account/transcribe`.
2. With the feature disabled and an authenticated user:
   - wait for the account heading or identity to render;
   - assert no link with accessible name `Транскрибування` exists;
   - assert the existing Karma link remains present.
3. Existing tests must continue to assert:
   - authenticated account information renders;
   - account overview does not render contribution history;
   - unauthenticated users are redirected to `/account/login`.

## Verification commands

```bash
yarn vitest run src/app/account/page.test.tsx
yarn typecheck
```

</TestPlan>

## Acceptance Criteria

- An authenticated user sees `Транскрибування` on `/account/` only when `NEXT_PUBLIC_ENABLE_TRANSCRIBE` is exactly `true`.
- Activating the link navigates to `/account/transcribe`.
- The existing account and Karma behavior is unchanged.
- No Zone B files or public API contracts are modified.
- The specified test file and typecheck pass.
