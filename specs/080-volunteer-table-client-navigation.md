---
description: Use App Router links for tables listed on volunteer profiles.
status: implementation-ready
targets:
  - src/app/volunteers/[volunteerSlug]/page.tsx
  - src/app/volunteers/[volunteerSlug]/page.spec.tsx
context:
  - CONVENTIONS.md
  - TESTING_CONVENTIONS.md
  - src/app/volunteers/[volunteerSlug]/page.tsx
  - src/app/volunteers/[volunteerSlug]/page.spec.tsx
  - src/app/[tableId]/[page]/page.tsx
---

# Volunteer Table Client Navigation

<Architecture>

## Goal and boundaries

Use Next.js App Router client-side navigation for table links rendered on a volunteer profile instead of forcing a full-document navigation with a native anchor. Preserve the existing link target, displayed title, styling, volunteer data flow, and table route behavior.

This is a Zone A presentation/navigation change only. It does not change the table route, volunteer data, schemas, API contracts, authentication, persisted state, or any Zone B file. The reported React DevTools `Bridge ... shut down` error originates in the browser DevTools backend according to its supplied stack; switching link behavior may avoid a triggering full-page transition, but eliminating that extension error is not guaranteed and is not an acceptance criterion.

## Zone A — exact operations

- `src/app/volunteers/[volunteerSlug]/page.tsx`: keep the page as a React Server Component. Replace the native `<a>` used for each table entry with the already-imported `Link` from `next/link`. Keep `href={`/${tableMetadata.id}/1/`}`, `styles.tableLink`, and the table title unchanged.
- `src/app/volunteers/[volunteerSlug]/page.spec.tsx`: extend the existing volunteer profile rendering test to assert that the table title is rendered as a link with its exact current destination.

No new component, hook, router state, or navigation abstraction is needed. Use the existing `Link` import and existing test mock boundary.

</Architecture>

<DataFlow>

## Table navigation

1. The existing server-side `getVolunteers()` result supplies `volunteer.tables` to `VolunteerPage`; no data transformation or mutation is introduced.
2. For each table, the render continues to read `tableMetadata.id` and `tableMetadata.title` and emits a Next.js `Link` with the exact href `/${tableMetadata.id}/1/` and the existing `styles.tableLink` class.
3. With client JavaScript active, Next.js intercepts an eligible same-tab activation and routes to the existing `src/app/[tableId]/[page]/page.tsx` page. That route continues to resolve the same `tableId` and `page` and keeps its existing rendering and not-found behavior.
4. Browser Back returns to the prior volunteer profile entry using normal App Router/history behavior. With JavaScript unavailable, the link retains standard link navigation behavior.

No API request, server mutation, client-owned state transition, retry, or changed public URL contract is introduced. The test's existing `next/link` mock renders a plain anchor for DOM assertions; it verifies markup and target, not App Router interception.

</DataFlow>

<FailureModes>

- **Destination drift:** preserve the trailing slash and page number `1`; do not change the current `/${tableMetadata.id}/1/` route shape or derive a different identifier.
- **Presentation or accessibility regression:** preserve the visible table title and `styles.tableLink`; the resulting element must remain discoverable as a link by its title.
- **Missing or invalid table route:** do not add fallback, retry, or error handling in the profile. Existing table-route resolution and not-found handling remain authoritative.
- **JavaScript disabled or client navigation unavailable:** rely on the semantic `Link`'s normal anchor fallback; do not replace the link with imperative `router.push` or add a client component.
- **DevTools bridge error persists:** do not add application error suppression or claim this change fixes extension behavior. Record it as unresolved browser/extension behavior and reproduce separately with React DevTools enabled and disabled.
- **Type rules:** retain existing `tableMetadata.id` typing and inferred link props. Do not add `any`, type assertions, casts, schemas, or weakened types.

</FailureModes>

<TestPlan>

## `src/app/volunteers/[volunteerSlug]/page.spec.tsx`

- Keep the test at the current React Server Component payload/render boundary; do not add hooks or mount a client router.
- Keep the current mocked `next/link` boundary, which renders an anchor, and the existing mocked volunteer data.
- In the existing successful volunteer-profile rendering test, assert that a link named `Table 1` (from the fixture) exists and has `href="/table-1/1/"` (from fixture ID `table-1`). The assertion must also establish the table title remains its accessible link name.
- Keep existing profile and metadata assertions passing; do not alter the existing dependency mocks or unrelated test setup.

## Verification

- Run `yarn test --run 'src/app/volunteers/[volunteerSlug]/page.spec.tsx'` and require the targeted tests to pass.
- Run `yarn exec tsc --noEmit` and require the frontend TypeScript check to pass.
- Browser smoke check: activate a table link from a volunteer profile, verify the table page loads, then use browser Back and verify return to the profile. With client routing active, verify activation does not cause a full-document navigation. If the reported DevTools error remains, compare with the React DevTools extension disabled; its disappearance is not required for acceptance.

</TestPlan>
