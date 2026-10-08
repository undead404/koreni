---
description: Add an indexation research reminder and a cross-tab, once-daily consent gate before revealing volunteer email.
status: implementation-ready
targets:
  - src/app/[tableId]/[page]/table-content.tsx
  - src/app/[tableId]/[page]/table-content.module.css
  - src/app/[tableId]/[page]/table-content.test.tsx
  - src/app/components/comments/comments.tsx
  - src/app/components/comments/comments.module.css
  - src/app/components/comments/comments.test.tsx
  - src/app/components/contact-gate.tsx
  - src/app/components/contact-gate.module.css
  - src/app/components/contact-gate.test.tsx
  - src/app/helpers/volunteer-contact-consent.ts
  - src/app/helpers/volunteer-contact-consent.test.ts
context:
  - CONVENTIONS.md
  - TESTING_CONVENTIONS.md
  - specs/074-account-email-visibility.md
  - src/app/components/modal.tsx
  - src/app/components/modal.module.css
  - src/app/components/archive-item.tsx
  - src/app/components/comments/remark42.tsx
  - src/app/helpers/get-volunteers.ts
---

# Indexation Research and Volunteer Contact Consent

<Architecture>

## Goal and boundaries

Implement two separate Zone A experiences:

1. On an indexation page, prompt readers to examine the indexation and its available source links and archive references before seeking help. Explain in the comments section that comments are community notes for future researchers and passers-by; the author is not guaranteed to see or answer them.
2. On a volunteer profile, require a prose-only affirmation before revealing the volunteer's email. Remember an affirmative consent across tabs in the same browser profile for the current local calendar day. Do not repeat the popup after that day's consent has been stored.

This is a courtesy reminder, not verified proof of research or an email-access security boundary. Do not change author email publication, static profile projection, author data, login behavior, or any API contract. `specs/074-account-email-visibility.md` remains the governing specification for whether an author's email may be published at all.

## Zone A — exact operations

### Indexation page reminder

- `src/app/[tableId]/[page]/table-content.tsx`: render a short research reminder after the indexed-data section and before `<Comments />`. It points readers to source links and archive references already shown in the page metadata. It must not assert that every reference is searchable in Duckinspector or that a missing result proves no record exists.
- `src/app/[tableId]/[page]/table-content.module.css`: style the reminder consistently with the table page and its supported themes.
- `src/app/[tableId]/[page]/table-content.test.tsx`: assert the reminder is present after the data section and before the comments section; assert `Comments` receives the indexation-only context.

### Comments disclosure

- `src/app/components/comments/comments.tsx`: add an optional, narrowly typed indexation context. Render the author-visibility disclosure only for the indexation route and only when the configured Remark42 comments section is rendered. Leave all other `Comments` call sites unchanged.
- `src/app/components/comments/comments.module.css`: style the disclosure.
- `src/app/components/comments/comments.test.tsx`: test the disclosure in indexation context, its absence in default context, and that no disclosure or comments UI is rendered when `NEXT_PUBLIC_REMARK42_HOST` is absent.

Approved meaning for the comments disclosure: comments are primarily for future researchers and people who find the page; the author may not see or respond to them, so comments are not a guaranteed contact channel.

### Volunteer profile consent gate

- `src/app/components/contact-gate.tsx`: on an email reveal request, read the current consent date. If there is no valid consent for today, open the consent dialog and keep the email hidden. Reuse the existing `src/app/components/modal.tsx`; do not modify that shared modal. After an affirmative response, reveal the email through the existing lazy-loaded `Contact` component.
- `src/app/components/contact-gate.module.css`: add only gate-specific styling needed for the dialog content and actions. Continue using the existing shared modal styles.
- `src/app/components/contact-gate.test.tsx`: cover gate interaction, modal dismissal, email reveal, and cross-tab synchronization.
- `src/app/helpers/volunteer-contact-consent.ts`: define the storage-key constant and narrowly typed operations to compute today's local calendar date, read whether today's consent exists, and attempt to store today's consent. Access browser storage only at runtime, not during module evaluation or server rendering.
- `src/app/helpers/volunteer-contact-consent.test.ts`: test local-date formatting, valid/current and stale/malformed markers, and storage read/write errors.

The popup contains prose only—no links. Its message asks the reader to inspect all available materials and links, search relevant archive references in Duckinspector where available, and do their own research before asking the volunteer for help. Provide an affirmative action that attests to this before showing the email and a decline/close action that does not reveal it. Do not add a checkbox requirement; the affirmative action itself is the attestation.

The contact gate is already rendered by `src/app/volunteers/[volunteerSlug]/page.tsx`; no change to that page is needed. Do not move the gate to the indexation page.

## Zone boundaries and conventions

- Every target is Zone A. There are no `src/server/` targets, backend `.js` import requirements, new server routes, or database changes.
- Keep server components as server components. Keep browser storage access and cross-tab event handling inside the existing client `ContactGate` and its runtime helper calls.
- Preserve strict TypeScript types and the existing email-visibility filtering boundary in `src/app/helpers/get-volunteers.ts`.
- The existing gate receives contact data as a prop. This change does not claim to prevent scraping or to make that public profile data private.

</Architecture>

<DataFlow>

## Indexation page and comments

1. `TableContent` renders its existing metadata (including source links and archive references) and paginated data unchanged.
2. After the data section, render the research reminder. It points the reader to the available sources and archive references in the metadata; it does not itself perform searches or validate that links were opened.
3. `TableContent` renders `Comments` with an indexation-only context.
4. If Remark42 is configured, `Comments` renders its normal heading and widget plus the disclosure that the author may not see or answer comments. If it is not configured, `Comments` returns no comments UI and no disclosure. Do not render a dead comments CTA.

## Consent state and email reveal

Use one site-wide key in `localStorage`:

```text
koreni:volunteer-contact-consent-date:v1
```

Its value is the current local calendar date in zero-padded `YYYY-MM-DD` form, computed from local year, month, and day—not UTC and not a rolling timestamp. The marker stores no user identity, email, volunteer ID, or indexation ID.

1. A visitor activates the existing reveal button. The gate reads the storage key at the time of the action.
2. If the value equals today's local date, reveal the requested email. Each new profile still requires an explicit reveal-button action; acceptance does not automatically reveal other contacts.
3. If the value is absent, invalid, stale, or unreadable, open the consent dialog. Keep the email hidden until the visitor affirms.
4. On affirmation, attempt to store today's date, close the dialog, and reveal the currently requested email. If storage write fails, the affirmation still permits this current reveal; because no date was stored, the next reveal attempt asks again.
5. On decline, Escape, or modal close, reveal nothing and write no marker. The visitor may retry immediately. Without a valid same-day acceptance, each retry opens the dialog again.
6. Each mounted gate listens for relevant browser `storage` events and re-evaluates the stored date. A same-day acceptance in another tab updates the gate. If a consent dialog is already open for a pending reveal request, a valid acceptance received from another tab completes that pending explicit reveal; it must not expose unrelated contacts or reveal without a reveal request.
7. A newly opened tab or newly mounted gate checks `localStorage` on its own reveal action. At the next local calendar day, the previous marker no longer matches, so a new affirmation is required.

This behavior is browser-profile-local. Separate browser profiles, devices, private browsing contexts, cleared storage, or different origins do not share the marker. The marker is user-editable and is not an enforcement/security credential.

## Approved UI copy

Use Ukrainian strings with these meanings; keep the consent dialog link-free:

- **Indexation reminder:** Before seeking help, review this indexation, its available source links and archive references, and search the listed archive codes in Duckinspector where supported.
- **Comments disclosure:** Comments are primarily for future researchers and other visitors. The author may not see or answer them; they are not a guaranteed way to contact the author.
- **Consent dialog:** Try to work through the available materials and links and conduct your own research before asking the author for help. Only then reveal the email for a specific remaining question.
- **Affirmation action:** Explicitly attest that the reader has tried to investigate first and wants to reveal the email.
- **Decline action:** Declines consent and leaves the email hidden; it must not impose a waiting period on retry.

Do not state that a Duckinspector no-result is proof of absence, that comments notify the author, or that the author will respond.

</DataFlow>

<FailureModes>

## Storage and consent failures

- **`localStorage` read throws, is unavailable, or cannot be accessed:** Treat consent as unknown. Show the dialog before every reveal attempt. If the visitor affirms, reveal only for that attempt; do not claim the consent was remembered.
- **`localStorage` write throws or is unavailable:** The affirmative action still reveals the email for that current attempt. Do not write an in-memory or `sessionStorage` fallback that pretends to satisfy cross-tab persistence. The next reveal attempt shows the dialog again.
- **Marker missing, malformed, or for another local date:** Treat it as no current consent and show the dialog. Do not coerce malformed values or accept a future/stale value.
- **Visitor declines or closes the dialog:** Do not reveal the email, do not store acceptance, and allow an immediate retry. The dialog may appear again on each later reveal attempt until the visitor affirms or a same-day acceptance arrives from another tab.
- **Consent accepted in another tab:** Process the `storage` event and validate its value against the current local date. Do not blindly trust arbitrary or stale event values. An open dialog for a pending explicit reveal request may complete that request; other gates remain unrevealed until clicked.
- **Local date changes while a page is open:** Recheck the marker at the next reveal action. Do not rely solely on state captured at initial render.
- **Clock changes or manually edited storage:** The date marker is not tamper-proof. This mechanism is a courtesy attestation, not a security boundary; do not add account identity or server enforcement to compensate.

## Comments and archive-reference failures

- **Remark42 host absent:** Render neither the comments widget nor its author-visibility disclosure. The independent indexation research reminder may remain.
- **Duckinspector link unavailable for an archive or its search returns no result:** Do not block the researcher from reading, commenting, or later contacting the volunteer. Do not characterize absence of a result as proof that no relevant record exists.
- **External source link is inaccessible or not a spreadsheet:** The reminder remains generic about available sources and links. It does not guarantee every link opens or require a successful search before contact.

## Privacy and public-data rules

- Never place contact emails or identity data in the consent marker, logs, analytics, or a new API.
- Do not weaken `specs/074-account-email-visibility.md` or rely on the contact dialog as a substitute for email suppression. The email is not made private by this UI gate.
- Do not add retry timers, a daily rejection lockout, server-side persistence, or automatic opening of contacts after acceptance.

</FailureModes>

<TestPlan>

All tests are Zone A Vitest tests. Tests run offline; no network boundary or global `fetch` mock is needed. Native dialog behavior in JSDOM must be stubbed using the pattern in `src/app/components/sharhoroots-prompt.test.tsx`.

## `src/app/[tableId]/[page]/table-content.test.tsx`

- Keep existing table, metadata, archive item, map, pagination, and JSON-LD assertions.
- Assert the research reminder renders after the indexed-data section and before the comments section.
- Assert `Comments` receives the indexation-only context; do not alter other routes' default comments context.

## `src/app/components/comments/comments.test.tsx`

- With Remark42 configured and indexation context, assert the disclosure appears and says the author may not see or answer comments; assert the existing heading and mocked Remark42 widget remain.
- With Remark42 configured and no indexation context, assert the disclosure is absent.
- With Remark42 unconfigured, assert the component is empty, including no disclosure or comment CTA.

## `src/app/helpers/volunteer-contact-consent.test.ts`

- Assert the current local date is serialized as zero-padded `YYYY-MM-DD` using local date fields.
- Assert only an exact current-date marker is valid; missing, malformed, stale, and future markers are invalid.
- Assert a storage read exception yields no remembered consent.
- Assert a storage write exception is reported as not remembered so the gate can reveal only the current affirmed attempt and re-prompt next time.
- Assert the key and value contain no email, author identity, profile ID, or table ID.

## `src/app/components/contact-gate.test.tsx`

- Reset storage and mock dialog `showModal()`/`close()` for each test; retain the lazy `Contact` boundary.
- Initially assert the email is absent. Clicking reveal without today's consent opens the prose-only dialog; assert it contains no links and the email remains absent.
- When storage succeeds, assert affirmation stores today's local date before revealing the email. When storage fails, assert the current affirmed reveal still succeeds without a stored marker. Assert the affirmative copy attests to having investigated first.
- Assert decline, Escape, close button, and backdrop dismissal do not reveal the email or store acceptance; a subsequent click immediately opens the dialog again.
- Assert a second gate instance representing another profile reveals after an explicit click without another dialog when today's marker exists.
- Simulate a cross-tab `storage` event carrying today's valid marker. Assert subsequent reveal needs no popup; when the gate already has a pending reveal dialog, assert it does not ask again and completes only that pending reveal.
- Assert an expired or malformed marker opens the dialog, including after advancing the clock to the next local calendar day.
- Make storage read/write throw. Assert every reveal request opens the dialog; after an affirmative action the requested email is revealed for that attempt, and a newly mounted gate prompts again.
- Assert acceptance never automatically reveals a different, unrequested contact.

## Verification

- Run targeted tests:

  ```sh
  yarn test --run "src/app/[tableId]/[page]/table-content.test.tsx" src/app/components/comments/comments.test.tsx src/app/components/contact-gate.test.tsx src/app/helpers/volunteer-contact-consent.test.ts
  ```

- Run `yarn typecheck` and lint the changed Zone A source/tests.
- Manually verify two same-origin browser tabs: consent in tab A suppresses the dialog in tab B for the rest of the local day; after local-date rollover the dialog appears again.
- Verify with comments configured and unconfigured that the author-visibility notice only appears alongside an available indexation comments section.
- Confirm no server target, database change, API contract, author metadata, suppression policy, or new tracking was introduced.

</TestPlan>

## Acceptance summary

1. Indexation readers are prompted to inspect available materials before seeking help.
2. Comments are clearly framed as community notes for future readers, with no promise the author will see or answer them.
3. Volunteer email requires explicit prose-based affirmation unless valid same-day consent is already stored.
4. Valid consent is shared across tabs in one browser profile for the local calendar day; storage failures cause a prompt before every reveal.
5. Declining never reveals email, persists no consent, and has no retry constraint.
6. The popup has no links, and the feature makes no claim of verified research or email privacy.
7. Existing volunteer email-visibility policy and all backend contracts remain unchanged.
