---
description: Replace the volunteer profile contact paragraph wrapper so the consent dialog is not nested in a paragraph.
status: implementation-ready
targets:
  - src/app/volunteers/[volunteerSlug]/page.tsx
  - src/app/volunteers/[volunteerSlug]/page.spec.tsx
context:
  - CONVENTIONS.md
  - TESTING_CONVENTIONS.md
  - specs/079-volunteer-contact-research-checkpoint.md
  - src/app/volunteers/[volunteerSlug]/page.module.css
  - src/app/components/contact-gate.tsx
  - src/app/components/contact-gate.test.tsx
  - src/app/components/modal.tsx
---

# Volunteer Contact Dialog HTML Nesting

<Architecture>

## Goal and boundaries

Remove the invalid HTML nesting reported when the consent dialog opens on a volunteer profile. The profile currently places `ContactGate` inside a `<p>`; the gate renders a `<dialog>` containing headings, `<div>` elements, and paragraphs. Replace the profile wrapper with a `<div>` so the modal's flow-content subtree is valid.

This is a Zone A markup and regression-test change. Keep `VolunteerPage` a React Server Component and keep the existing client boundary in `ContactGate`. Preserve the displayed email label, `styles.contact`, email data, reveal/consent behavior, and the conditional omission of contact UI when the volunteer has no emails. Do not change the shared modal, contact gate, CSS, data projection, public contracts, or any Zone B file.

## Zone A — exact operations

- `src/app/volunteers/[volunteerSlug]/page.tsx`: replace only the `<p className={styles.contact}>` wrapper around `Електронна пошта:` and `<ContactGate>` with `<div className={styles.contact}>`. Keep the existing `volunteer.emails.length > 0` condition, text, component props, and class name unchanged. Close the wrapper with `</div>`.
- `src/app/volunteers/[volunteerSlug]/page.spec.tsx`: extend the successful profile rendering test to assert that the `.contact` wrapper is a `DIV`, while retaining the existing volunteer name, rank, stats, table-link, and email assertions. Keep the current `ContactGate` mock boundary; this test remains a page-markup test, not a client interaction test.

Do not add a new component, hook, portal, or modal abstraction. Do not change `src/app/volunteers/[volunteerSlug]/page.module.css`; the existing `.contact` rule remains attached to the same class and the global reset already removes default element margins.

## Zone boundaries and conventions

- Both targets are Zone A. There are no `src/server/` targets, API/database changes, or backend import requirements.
- Keep server-side volunteer fetching and parameter parsing unchanged.
- Preserve strict typing and the current data and email-visibility filtering boundary.
- `specs/079-volunteer-contact-research-checkpoint.md` remains the governing consent specification; this correction does not change its behavior or boundaries.

</Architecture>

<DataFlow>

## Contact markup and consent state

1. `VolunteerPage` continues to parse the route parameter and obtain the volunteer using the existing `getVolunteers()` flow.
2. When `volunteer.emails.length > 0`, the page emits a `<div className={styles.contact}>` containing the existing email label and `ContactGate` with the same `volunteer.emails` prop. When the list is empty, it emits no contact wrapper, label, or gate.
3. Before consent, `ContactGate` continues to render its reveal button and closed modal state as it does today. On a reveal request without valid same-day consent, it opens the existing modal. The dialog, heading, body, and actions are now descendants of the contact `<div>`, not a paragraph.
4. Affirmation, decline, Escape, close-button, backdrop, storage, and email-reveal state transitions remain exactly as specified in `specs/079-volunteer-contact-research-checkpoint.md`.

No data is mutated or transformed. No API request, storage-key change, public route change, server/client boundary change, or new state transition is introduced.

</DataFlow>

<FailureModes>

- **Email list is empty:** Preserve the existing conditional and emit no contact wrapper or gate.
- **Dialog opens without valid consent:** Keep the existing modal and consent behavior; the rendered dialog must not have a `<p>` ancestor.
- **Consent is declined or the modal is dismissed:** The email remains hidden and retry behavior remains unchanged.
- **Valid same-day consent exists:** Preserve direct reveal behavior without opening the dialog.
- **HTML nesting warning remains:** Treat this as a failed correction; do not suppress React's console warning or alter the modal to mask the page's invalid parent element.
- **Visual regression:** Retain `styles.contact`, its existing CSS rule, the contact label, and the gate placement. Do not add CSS changes unless separately approved; this implementation is markup-only.
- **Scope drift:** Do not alter `ContactGate`, `Modal`, volunteer metadata, email visibility policy, API contracts, schemas, authentication, or Zone B files.
- **Type rules:** Do not add casts, `any`, weakened types, or new schemas for this presentation-only change.

</FailureModes>

<TestPlan>

All tests are Zone A Vitest tests and run offline. Keep the existing page test's dependency mocks, including the `ContactGate` mock that renders its contact prop in a `<span>`. Do not mount the RSC in a different topology or add browser APIs to this page test.

## `src/app/volunteers/[volunteerSlug]/page.spec.tsx`

- In the existing successful profile rendering test, retain assertions for volunteer name, rank, power, table count, table link and destination, and contact text.
- Capture the existing `render(jsx)` container and assert `container.querySelector('.contact')?.tagName` is exactly `'DIV'`. This fails while the contact wrapper is a paragraph and protects the corrected parent element.
- Keep the existing mocked `next/link`, mocked `getVolunteers`, and mocked `ContactGate` boundaries. Do not replace the contact mock with an interaction test in this RSC test.

## `src/app/components/contact-gate.test.tsx`

- Do not change this file. Run its existing tests as a regression guard for dialog opening, consent, dismissal, and reveal behavior. Its native `HTMLDialogElement.showModal()` and `.close()` stubs remain the mock boundary for dialog behavior.

## Verification

- Run the targeted tests:

  ```sh
  yarn test --run 'src/app/volunteers/[volunteerSlug]/page.spec.tsx' src/app/components/contact-gate.test.tsx
  ```

- Run `yarn typecheck` and require it to pass.
- In a development browser, open a volunteer profile with at least one email and no current-day consent, activate `Показати`, and confirm the consent dialog opens with no React invalid-nesting warnings. Confirm decline leaves the email hidden and affirmation still reveals it. Also confirm a profile with no email does not show the contact row.
- Verify the contact label and reveal button remain styled and readable in the existing profile layout.

</TestPlan>

## Acceptance summary

1. The volunteer contact gate is no longer a descendant of a paragraph.
2. Opening the existing consent dialog produces no `<p>` nesting warnings for `<dialog>`, headings, `<div>` elements, or the dialog's body paragraph.
3. The contact class, label, email prop, no-email conditional, and all consent transitions remain unchanged.
4. Targeted tests and type checking pass; no CSS, modal, contact-gate, API, schema, or Zone B modification is made.
