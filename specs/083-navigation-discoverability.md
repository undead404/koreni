---
description: Improve desktop discovery of Koreni's archival-data destinations while preserving mobile navigation.
status: draft
targets:
  - src/app/components/header.tsx
  - src/app/components/header.module.css
  - src/app/components/header.test.tsx
context:
  - src/app/layout.tsx
  - src/app/components/posthog-navigation-tracker.tsx
  - src/app/components/search-result.tsx
  - src/app/services/search.ts
  - src/app/components/source-link.tsx
  - src/app/globals.css
  - specs/020-add-contribute-link-to-nav.md
  - specs/021-improve-header-responsive.md
  - specs/022-improve-header-desktop.md
---

# Improve Navigation Discoverability

## Problem Statement and Evidence

Koreni primarily helps people discover archival information: search indexed records, see what data exists, and reach relevant records. Navigation should foreground these journeys, not genealogy-tree management.

The user supplied PostHog observations: pageviews declined 66%, unique visitors declined 18%, average session duration increased 28%, and pageviews per session declined from about 4.60 to 1.93, while core search activity remained relatively stable. These figures have not been independently verified. The pageviews-per-session decline is consistent with less exploration but does not establish that navigation caused it. Traffic composition, instrumentation, seasonality, and visitor intent could also explain the changes. Longer sessions might represent deeper research.

### Confirmed findings

- `src/app/components/header.tsx` displays the logo, contribution link, account link, and menu button. Search appears only off the home page. Map, Tables, Volunteers, Blog, About, and License are inside the expandable menu.
- The menu is collapsed on desktop and mobile; CSS changes its layout by viewport, not which destinations are initially visible. The current mobile breakpoint is 767/768px.
- The menu duplicates the contribution destination. `aria-controls="main-menu"` points to a panel that is conditionally rendered and absent while closed.
- Git history dates the redesign to commit `d3976301` on 2026-08-24. Before it, Search, contribution, About, Volunteers, Map, and Tables were directly listed; mobile used a horizontally scrollable list. Commit `c4484f67` on 2026-08-26 added Blog to the menu. These dates establish timing, not causation.
- The home page links to the Tables directory; Tables lists indexed tables; search results link to record pages; Map is a separate available-data route. (`src/app/page.tsx`, `src/app/tables/page.tsx`, `src/app/map/page.tsx`, `src/app/components/search-result.tsx`)
- Existing analytics include `$pageview`, `search_performed`, `search_result_clicked`, and `source_link_clicked`. No header/menu events were found. (`src/app/components/posthog-navigation-tracker.tsx`, `src/app/services/search.ts`, `src/app/components/search-result.tsx`, `src/app/components/source-link.tsx`)

### Plausible explanation and unresolved evidence

Hiding Map and Tables could make those record-discovery routes less apparent. The reported decline in pageviews per session is compatible with this explanation, but the repository cannot establish causation or destination popularity. Comparison windows, route-level engagement, traffic mix, and instrumentation history remain to be verified during evaluation.

## User Journeys and Requirements

1. **Search to record:** arrive at `/`, search, select a result, and view its record page.
2. **Browse indexed material:** reach `/tables`, choose an indexed table, and open a record.
3. **Explore geographically:** reach `/map` to explore available data by place.
4. **Participate or learn:** reach contribution, volunteer, project, blog, or license information.
5. **Account access:** reach `/account`; public-header behavior within `/account` routes remains unchanged.

At desktop widths, make Search, Map, and Tables visible without opening the menu. Preserve the existing mobile navigation exactly as a visual and interaction design: same top-bar controls, menu contents/order, responsive layout, and menu behavior. Do not add a persistent mobile navigation row. At desktop widths, retain the visible contribution and account links and use the menu for secondary destinations. Avoid duplicate contribution links in the desktop menu. Keep all destinations reachable and active-route indications correct. Add navigation events but do not run a concurrent experiment or set numeric success thresholds. Treat analytics as observational evidence, not proof of causation.

## Alternatives and Trade-offs

| Direction                                                                                  | Benefits                                            | Costs and risks                                          | Decision     |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------- | -------------------------------------------------------- | ------------ |
| Restore every destination as a persistent desktop link                                     | Maximum visibility                                  | Crowded flat hierarchy, especially with Blog and License | Not selected |
| Keep all destinations collapsed and improve menu affordance                                | Smallest structural change                          | Map and Tables remain hidden until menu opens            | Not selected |
| Keep Search, Map, and Tables visible on desktop; disclose secondary links; preserve mobile | Prioritizes record discovery without mobile clutter | Requires desktop-only responsive presentation and tests  | Recommended  |

Use the existing 768px desktop/mobile boundary. Verify the layout fits at 768px; if not, move the desktop breakpoint to the smallest width where it fits, leaving the mobile presentation unchanged. Add no dependencies.

## Recommended Design

Add a desktop-only primary navigation for **Пошук**, **Мапа**, and **Таблиці**. Keep the existing top-bar contribution and account links. Keep the menu button and use the menu for Volunteers, Blog, About, and License. Hide the menu’s Map/Tables group and duplicate contribution item only at desktop widths. Preserve those entries on mobile.

This is progressive disclosure: core archival-data destinations are visible where space permits; secondary destinations remain grouped. Do not change routes or optimize for increased pageviews. Keep the current visible menu label; relabeling is out of scope.

## Desktop and Mobile Behavior

### Desktop (`>= 768px`)

1. Show a named primary navigation landmark with links to `/`, `/map`, and `/tables` on every public route, including `/`.
2. Hide the existing conditional Search link in the top bar at desktop widths to avoid duplicate Search links.
3. Keep contribution, account, and the menu trigger in the top bar.
4. The menu starts closed. When open, show secondary destinations without duplicate Map, Tables, or contribution links.
5. Preserve active styles and `aria-current="page"`, including nested Blog routes.

### Mobile (`<= 767px`)

1. Preserve the existing visible content, link order, menu organization, CSS layout, and interactions exactly.
2. Do not show the new desktop primary navigation.
3. Navigation events may be captured, but must not alter appearance or consent behavior.

### Disclosure state

- Keep the panel in the DOM while closed and use its hidden state to control visibility. `aria-controls="main-menu"` must always reference an element.
- Keep `aria-expanded` synchronized with open/closed state.
- Escape closes the panel and restores focus to the trigger. Outside-pointer interaction closes it without moving focus. Activating a menu destination closes it.
- Preserve normal link and browser Back/Forward behavior.

## Accessibility

- Place desktop Search/Map/Tables links in a semantic `<nav>` with a descriptive Ukrainian accessible name.
- Use a native button for the disclosure and native links for routes.
- Keep `aria-controls` valid in both disclosure states and update `aria-expanded` on every transition.
- Preserve Enter/Space activation, logical Tab order, Escape dismissal, and focus restoration. Do not trap focus in the non-modal panel.
- Preserve visible focus indicators and prevent the desktop row from clipping them.
- Use `aria-current="page"` on active links; do not rely on color alone.
- Ensure both layouts work at 200% zoom without page-level horizontal overflow.

## <Architecture>

Zone A only. Modify `src/app/components/header.tsx`, `src/app/components/header.module.css`, and `src/app/components/header.test.tsx`. Use the existing React client component, CSS module, Next.js links, route state, PostHog provider, and 767/768px responsive boundary. Add desktop primary navigation for Search, Map, and Tables. Keep secondary routes in the existing disclosure. Preserve the mobile presentation and account-route suppression. Do not modify `src/app/layout.tsx`, server files, APIs, schemas, routes, or dependencies.

### Proposed file operations

- `src/app/components/header.tsx`: add desktop primary links; preserve mobile links/composition; hide the old top-bar Search at desktop; retain the disclosure for secondary routes; keep Map/Tables and contribution in its mobile menu; keep `main-menu` mounted with a hidden state; add the approved PostHog events.
- `src/app/components/header.module.css`: add desktop-only primary-nav styling at 768px; hide promoted destinations and duplicate contribution only in the desktop menu; preserve mobile styles and panel layout. Verify fit at the breakpoint and both themes using existing variables.
- `src/app/components/header.test.tsx`: test desktop links, unchanged mobile content, menu behavior, active routes, and analytics events. Verify media-query appearance manually in a browser.
- Zone B: no targets and no server/API/data/authentication/persistence changes.

## <DataFlow>

1. Initial menu state is closed. The panel is present but hidden; `aria-expanded="false"` and `aria-controls="main-menu"` agree.
2. A closed-to-open trigger activation updates menu state and emits `header_menu_opened` once with `{ viewport: 'mobile' | 'desktop' }`.
3. Closing through trigger, Escape, outside pointer, or menu-link activation returns state to closed. Emit no menu-close event.
4. A destination-link activation emits `header_navigation_clicked` with fixed `{ destination, placement, viewport }` values before normal navigation:
   - `destination`: `search`, `map`, `tables`, `contribute`, `account`, `volunteers`, `blog`, `about`, or `license`
   - `placement`: `primary`, `top_bar`, or `menu`
   - `viewport`: `mobile` or `desktop`, using the layout breakpoint
5. Do not capture query parameters, search text, raw URLs, or personal data. Preserve existing PostHog opt-out/consent behavior. Analytics must not block or alter navigation.
6. Leave `$pageview`, `search_performed`, `search_result_clicked`, and `source_link_clicked` unchanged. Do not run a concurrent experiment or add numeric success thresholds.

## Acceptance Criteria

1. At desktop widths, Search, Map, and Tables are visible without opening the disclosure; Search is visible on `/`.
2. Desktop has no redundant top-bar Search or duplicate Map/Tables/contribution links in the open menu.
3. At mobile widths, header appearance, link order, menu content, layout, and interactions remain unchanged.
4. All destinations remain reachable; active states work for root, Map, Tables, contribution, and nested Blog routes.
5. Account routes continue to omit the public header.
6. The panel exists while closed; ARIA state, Escape, outside-pointer, and menu-link behavior are correct.
7. The two approved events use only the stated names and allowlisted values, respect consent, and do not interfere with navigation.
8. Header tests pass. Manual checks confirm breakpoint fit, unchanged mobile appearance, keyboard use, both themes, and no clipping at 200% zoom.
9. No backend files, schemas, APIs, dependencies, routes, or data contracts change.

## Measurement and Validation Plan

- Add the two approved events; do not run an A/B or concurrent experiment.
- After deployment, examine menu-open rate, menu-to-link conversion, and Map/Tables clicks by viewport and landing route. Use opted-in sessions as denominators.
- Compare secondary-section discovery with existing `search_result_clicked` and `source_link_clicked` activity as meaningful archival-research outcomes.
- Do not treat more pageviews, longer sessions, or numeric uplift thresholds as success criteria. Report rates with denominators and note consent coverage, traffic source, and viewport mix.
- Verify historical comparison windows and instrumentation before comparing them. Treat pre/post differences as observational, not causal.

## <FailureModes>

- **Panel absent while closed:** keep the controlled element mounted and hidden so `aria-controls` never points to a missing ID.
- **Wrong responsive boundary:** test at 767px and 768px. Do not alter mobile composition at `<= 767px`.
- **Desktop crowding:** validate actual layout fit at the breakpoint; adjust the desktop threshold if needed without changing mobile presentation.
- **Duplicate links:** hide top-bar Search at desktop and suppress the Map/Tables group plus duplicate contribution item only in the desktop menu.
- **Nested/trailing-slash route mismatch:** preserve current normalization and Blog-prefix matching.
- **Incorrect dismissal/focus:** Escape restores trigger focus; outside pointer closes without moving focus; pointer events inside the panel do not close it.
- **Analytics opted out, missing, or uninitialized:** do not bypass consent or add persistence. Navigation continues normally.
- **Analytics event failure or malformed properties:** emit only fixed allowlisted values. Add no retry or server call; event capture must not prevent the native/Next link action.

## <TestPlan>

- **Exact test file:** `src/app/components/header.test.tsx`.
- **Mock boundaries:** keep the current `usePathname` mock. Mock `posthog-js/react` `usePostHog` with a typed `capture` spy. Do not use live PostHog or network access.
- Assert desktop-primary Search, Map, and Tables links are represented; Search is active on `/`; Map/Tables are active on their routes.
- Assert nested `/blog/...` activates Blog, trailing-slash normalization works, and `/account/...` still renders no public header.
- Assert the panel exists but is hidden when closed; `aria-expanded` is false and `aria-controls` matches. Opening reveals the panel and emits exactly one `header_menu_opened` with the expected viewport.
- Assert link activations emit exactly one `header_navigation_clicked` with expected destination, placement, and viewport. Assert normal link behavior and menu dismissal remain intact. Closing emits neither an open event nor a close event.
- Assert mobile-visible link order/content and menu content match current behavior. Manually verify media-query appearance at 767px and 768px, narrow phone, landscape, and desktop.
- Run the targeted Vitest test, then standard type/lint checks. No backend or network tests are in scope.
