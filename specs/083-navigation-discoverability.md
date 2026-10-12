---
description: Keep search primary, move its destinations into the expandable menu, and add a homepage discovery section.
status: implementation-ready
targets:
  - src/app/components/header.tsx
  - src/app/components/header.module.css
  - src/app/components/header.test.tsx
  - src/app/components/home-discover.tsx
  - src/app/components/home-discover.module.css
  - src/app/components/home-discover.test.tsx
  - src/app/page.tsx
  - src/app/home-page.test.tsx
context:
  - src/app/layout.tsx
  - src/app/providers/posthog.tsx
  - src/app/components/posthog-navigation-tracker.tsx
  - src/app/components/search.tsx
  - src/app/components/search-results.tsx
  - src/app/globals.css
  - src/app/tables/page.tsx
  - src/app/map/page.tsx
  - src/app/blog/page.tsx
  - src/app/volunteers/page.tsx
  - specs/020-add-contribute-link-to-nav.md
  - specs/022-improve-header-desktop.md
---

# Search-first Discovery Destinations

## Goal and Evidence

Koreni's primary task is searching indexed records. Give visitors a secondary way to explore the service without putting another persistent navigation row in the header: put a compact discovery section on the homepage after search and before comments.

The existing `specs/083` draft recommended a persistent desktop Search/Map/Tables row. That design is superseded. The new direction puts Search, Map, and Tables in the existing expandable menu on every viewport and adds the homepage section **“Що ще тут є?”**. This intentionally supersedes the earlier requirement to preserve mobile navigation composition exactly.

The user-provided PostHog figures in the previous draft (declining pageviews and pageviews per session, with core search activity relatively stable) are not independently verified and do not establish that navigation caused the change. Treat all follow-up analytics as observational, not causal evidence.

Confirmed repository facts:

- `src/app/page.tsx` renders the search experience, then comments. `SearchPage` includes results and pagination; placing discovery after it ensures results come first.
- `/map`, `/tables`, `/blog`, and `/volunteers` are existing destinations. The volunteers page lists indexers, ranked by indexing activity.
- The homepage already links its indexed-table count to `/tables`; retain that text and link.
- Analytics opt-out is configured in the existing PostHog provider. Existing `$pageview`, search, and source-link events are out of scope and remain unchanged.

## User Journeys and Requirements

1. Search records from the homepage and see matching results before secondary destinations.
2. From the expandable menu, reach Search (`/`), Map (`/map`), and Tables (`/tables`) on desktop and mobile.
3. From the homepage discovery section, reach Map, all tables, Blog articles, or the indexer list.
4. Continue to reach contribution, account, volunteers, Blog, About, and License through their existing header controls/menu.
5. Account routes continue to omit the public header.

## Design and Alternatives

- **Persistent desktop Search/Map/Tables links:** rejected; duplicates search-first entry points and creates a second navigation system.
- **Show homepage discovery only when there are no results:** rejected for this implementation. Keep it below the entire SearchPage output (including results and pagination); when results exist, the section may be below the fold. When no results exist, it appears immediately after the search summary.
- **Recommended:** put Search, Map, and Tables in the expandable menu on all viewports; render one compact homepage discovery section under SearchPage and above Comments.

The discovery section uses this exact heading and destinations:

- **Що ще тут є?**
- **Мапа України з позначками наявних даних** → `/map`
- **Список наявних таблиць** → `/tables`
- **Блог коренів – про рушій та індексування** → `/blog`
- **Перелік тих, хто приніс дорогоцінні таблиці** → `/volunteers`

Use native links in a semantic section with a heading and list. Use existing theme variables; add no dependencies, counts, data fetching, or claims about individual indexers in the discovery section.

## Header Behavior

- Remove the desktop-only primary navigation and its styles.
- Add **Пошук** (`/`) as the first link in the existing **Дані** menu group, followed by **Мапа** and **Таблиці**. Keep this order on mobile and desktop.
- Remove the separate conditional top-bar Search link to prevent duplicate Search links. The page's search controls remain unchanged.
- Keep contribution and account links in the top bar. Keep secondary menu destinations and their existing organization. Keep the contribution entry in the expandable menu on both mobile and desktop, alongside its top-bar link.
- Preserve the existing 767/768px menu layout boundary, route normalization, Blog prefix matching, active styling, and `aria-current="page"` behavior.
- Keep the disclosure panel mounted while closed with `hidden`; `aria-controls="main-menu"` always resolves. Keep `aria-expanded` synchronized. Escape closes and restores trigger focus; outside-pointer closes without moving focus; menu destination activation closes the panel.

The literal move of Search into the expandable menu applies on mobile too. Do not retain the old mobile top-bar Search link or add a persistent mobile row.

## Analytics and Measurement

- Preserve `header_menu_opened` with `{ viewport: 'mobile' | 'desktop' }` on closed-to-open only.
- Preserve `header_navigation_clicked` and its fixed destination allowlist. Search/Map/Tables now emit `placement: 'menu'`; contribution/account top-bar links emit `top_bar`; menu destinations emit `menu`. Keep the old `primary` placement as an allowed historical value but do not emit it from the new header.
- Add `home_discover_clicked` from the client discovery component with exactly `{ destination: 'map' | 'tables' | 'blog' | 'volunteers', viewport: 'mobile' | 'desktop' }`.
- Determine viewport using `window.innerWidth < 768`; otherwise desktop. Emit before normal link navigation. Capture only the fixed values; never include query parameters, search text, URL, or personal data.
- Respect existing PostHog opt-out/consent behavior. Capture exceptions must be caught and must not block links. Add no retry, persistence, server request, experiment, or numeric success threshold.
- Do not change `$pageview`, `search_performed`, `search_result_clicked`, or `source_link_clicked`. After deployment, compare opted-in discovery/menu rates and destination clicks with denominators and note traffic/viewport mix. Treat results as observational.

## Acceptance Criteria

1. No persistent desktop Search/Map/Tables row exists; all three destinations are in the expandable menu on both viewport classes.
2. The top-bar Search link is absent. Search remains available from the menu and the homepage search controls remain unchanged.
3. The homepage section has the exact heading and four links above, follows all search results/pagination, and precedes comments.
4. Existing account-route suppression, active links, menu organization (including the contribution link in both the menu and top bar), keyboard behavior, and disclosure ARIA remain correct, except for the intentional Search relocation.
5. The two header events and new discovery event use only specified fixed values, respect opt-out, and cannot block navigation.
6. Tests, typecheck, and lint pass. Browser checks confirm both themes, keyboard use, no clipping, and no horizontal overflow at narrow widths and 200% zoom.
7. No backend files, APIs, routes, schemas, authentication, persistence, dependencies, or existing search/pageview event contracts change.

## <Architecture>

Zone A only. Use the existing header client component and CSS module, plus an isolated client component for discover-link analytics. Keep `src/app/page.tsx` as a Server Component and place the new section after the SearchPage Suspense boundary and before `<Comments />`.

### Exact file operations

- `src/app/components/header.tsx`: remove desktop primary navigation and the conditional top-bar Search link; add Search first in the Data menu; preserve contribution/account controls, other menu links, active routes, disclosure behavior, and the existing header event contracts.
- `src/app/components/header.module.css`: remove desktop-row/top-bar-search rules; show the Data menu group at desktop. Preserve the contribution menu item on both viewport classes, the existing mobile menu layout, and themes.
- `src/app/components/header.test.tsx`: replace desktop-primary assertions with menu placement/order assertions and cover active routes, dismissal, ARIA, and tracking.
- `src/app/components/home-discover.tsx`: new `'use client'` component. Render the heading and four native `next/link` destinations; capture `home_discover_clicked` with the fixed properties above. No fetching or state beyond click handling.
- `src/app/components/home-discover.module.css`: new responsive card/list styles using existing theme variables. No clipping or page-level horizontal overflow; visible focus remains unobstructed.
- `src/app/components/home-discover.test.tsx`: unit-test link targets, event properties, viewport classification, and navigation continuity when capture throws.
- `src/app/page.tsx`: render `HomeDiscover` after the existing SearchPage `<Suspense>` and before comments; preserve metadata, table-count description/link, record count, JSON-LD, and comments.
- `src/app/home-page.test.tsx`: retain the existing metadata/data mocks, add a `HomeDiscover` sentinel, and verify server-rendered search → discover → comments order. Do not mount the Server Component with React Testing Library.
- Zone B: no targets or changes.

## <DataFlow>

1. The Home Server Component loads table metadata and computes `recordsNumber` as it does today. It renders the existing search Suspense boundary, then `HomeDiscover`, then comments. It adds no server data read or mutation.
2. `HomeDiscover` renders the fixed route list regardless of query/results state. SearchPage results and pagination remain before it. No query/result text is passed into the client component.
3. Activating a discovery link emits one `home_discover_clicked` event with the destination slug and viewport, then normal Next navigation proceeds. Event failure has no effect on navigation.
4. Header starts with a closed menu and a mounted hidden panel. Trigger activation opens it and emits one `header_menu_opened`; closing through trigger, Escape, outside pointer, or link emits no close event. Menu-link navigation captures the allowlisted destination/placement/viewport before normal navigation.
5. No client persistence or cross-page application state is added. Existing PostHog opt-out and consent behavior governs captures.

## <FailureModes>

- **Search still duplicated:** remove the old top-bar Search link on every viewport; assert Search appears once in the menu.
- **Search results displaced:** keep discovery after the whole SearchPage output, including pagination; do not place it between search controls and results.
- **Loading/zero results:** render the section independently of result counts; do not flash it based on transient `resultsNumber` or hide it when matches exist.
- **Invalid route or empty indexer list:** use only the existing `/map`, `/tables`, `/blog`, and `/volunteers` routes; destination pages own their empty states.
- **Closed menu target missing:** retain the panel DOM with `hidden`, preserving its `main-menu` ID.
- **Responsive mismatch:** use the same 767/768px boundary for viewport event values; validate at 767px and 768px and at 200% zoom.
- **Nested/trailing slash routes:** retain path normalization and Blog-prefix matching; root, map, and tables use exact normalized path matches.
- **Escape/outside pointer behavior:** Escape closes and restores trigger focus; outside pointer closes without moving focus; inside pointer does not close.
- **PostHog unavailable, opted out, or throwing:** do not bypass consent; catch capture failure and preserve native/Next link navigation. No retry or server call.
- **Telemetry data leakage:** emit only fixed destination, placement, and viewport values; do not include query, raw URL, or personal data.

## <TestPlan>

- **Exact test files:** `src/app/components/header.test.tsx`, `src/app/components/home-discover.test.tsx`, and `src/app/home-page.test.tsx`.
- **Header mock boundaries:** retain the current `usePathname` mock; mock `posthog-js/react` `usePostHog` with a typed `capture` spy. No live PostHog/network.
- Assert Search/Map/Tables appear in the expandable panel in order; no standalone top-bar Search or desktop primary navigation remains. Assert menu destinations, links, and contribution/account placements.
- Assert root, Map, Tables, contribution, and nested Blog active states and `aria-current`; `/account/...` still omits the header.
- Assert mounted-but-hidden panel, `aria-controls`/`aria-expanded`, open event exactly once, Escape focus restoration, outside-pointer behavior, menu-link dismissal, and no close event.
- Assert `header_navigation_clicked` properties for menu and top-bar links, including the changed Search/Map/Tables placement.
- **Discovery component mock boundaries:** typed `usePostHog` capture spy only; no network or router service. Assert exact heading, four visible labels/hrefs, fixed destination/viewport properties, and that thrown capture does not cancel normal link activation.
- **Home page test boundaries:** retain existing mocks for table metadata, SearchPage, Comments, and JSON-LD; add a `HomeDiscover` sentinel and a typed `next/link`-to-anchor mock. Call `Home()`, serialize its result with `renderToStaticMarkup`, and assert search → discover → comments order plus existing route assertions. Do not mount the Server Component with React Testing Library.
- Run `yarn vitest run src/app/components/header.test.tsx src/app/components/home-discover.test.tsx src/app/home-page.test.tsx`, `yarn typecheck`, ESLint for changed TS/TSX files, and Stylelint for both CSS modules.
- Manually verify menu keyboard/focus behavior, both themes, narrow phone/landscape, 767px and 768px, and 200% zoom without horizontal overflow. No Zone B/network tests.
