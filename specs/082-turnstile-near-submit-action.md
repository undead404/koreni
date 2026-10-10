---
description: Place Turnstile and submission feedback with the final contribution action while preserving form-level verification ownership.
status: implementation-ready
targets:
  - src/app/components/contribute/contribute-form.tsx
  - src/app/components/contribute/contribute-form.module.css
  - src/app/components/contribute/stepper.tsx
  - src/app/components/contribute/stepper.test.tsx
  - src/app/components/contribute/step.tsx
  - src/app/components/contribute/step.module.css
  - src/app/components/contribute/step.test.tsx
context:
  - CONVENTIONS.md
  - TESTING_CONVENTIONS.md
  - specs/033-refactor-turnstile.md
  - specs/034-turnstile-form-not-submitted.md
  - specs/035-form-not-submitted.md
  - src/app/components/contribute/contribute-form.tsx
  - src/app/components/contribute/contribute-form.module.css
  - src/app/components/contribute/contribution-state.ts
  - src/app/components/contribute/stepper.tsx
  - src/app/components/contribute/step.tsx
  - src/app/components/contribute/step.module.css
  - src/app/components/contribute/use-submit-contribution.ts
---

# Turnstile Above the Final Contribution Action

<Architecture>

## Goal and boundaries

Place the Turnstile widget in the final review step, immediately before its submit action, so verification is visually associated with the action that starts it. Explain that clicking **Подати** starts verification and submission, and that the separate success panel—not Turnstile's verification state—confirms a received contribution.

This is a Zone A presentation and component-composition change. The current Turnstile widget is a child of the outer `<form>` but is rendered after `ContributeFormStepper`; the submit button is rendered inside the stepper. Keep the verification resolver and imperative execution ownership in `ContributeForm`. Do not change `turnstileResolver`, `executeTurnstile`, `useTurnstile()`, the `onVerify` callback behavior, Turnstile configuration, the API request or payload, server verification, schemas, authentication, persisted state, or any Zone B file.

## Zone A — exact operations

- `src/app/components/contribute/contribute-form.tsx`:
  - Keep `useTurnstile()`, the `turnstileResolver` ref, `executeTurnstile`, and the existing `onVerify` callback at the form level and behaviorally unchanged.
  - Keep the Turnstile element's existing `sitekey`, `execution="execute"`, and success callback. Provide that element to `ContributeFormStepper` as a typed React-node slot instead of rendering it after the stepper. The existing `!contributionState.prUrl` condition continues to omit the widget after successful submission.
  - Pass the existing `stage` value to the stepper. Remove the header-level progress message so the user receives a single progress announcement beside the final action.
- `src/app/components/contribute/stepper.tsx`:
  - Add a named, explicit `ContributeFormStepperProperties` interface for the widget slot and `SubmissionStage`.
  - Pass the widget only to the last `ContributeFormStep`, and only while there is no `prUrl`. Pass the existing stage value to that final step. Do not change step selection, validation, navigation, or completion logic.
- `src/app/components/contribute/step.tsx`:
  - Extend the step's props with typed Turnstile-slot and stage properties. In the active final step, render the following in order: the approved instruction, one dynamic submission status when submitting, the Turnstile widget, then the existing action buttons with **Подати**. This keeps the widget immediately above the final action while keeping progress feedback adjacent.
  - Use the approved instruction: `Натисніть «Подати», щоб запустити перевірку та надіслати дані. Відправлення підтвердимо окремо.`
  - Render the dynamic status with `role="status"`. Use stage-accurate Ukrainian text: verification: `Перевірка на людяність…`; conversion: `Перевірку пройдено — готуємо дані…`; transmission: `Перевірку пройдено — надсилаємо дані…`. Render no stage status when idle or not submitting.
  - While submitting, label the final button according to the current stage: `Перевіряємо…`, `Готуємо дані…`, or `Надсилаємо…` for verification, conversion, or transmission respectively. Preserve the existing disabled state and submit type.
- `src/app/components/contribute/contribute-form.module.css`: remove the header progress-message rule if it becomes unused after moving progress feedback into the final action area.
- `src/app/components/contribute/step.module.css`: style the helper, status, widget, and action as one vertical group. Keep the layout usable at mobile widths and support light and dark color schemes using the component's existing styling conventions. Do not place the widget beside the button.
- Add `src/app/components/contribute/stepper.test.tsx` and `src/app/components/contribute/step.test.tsx` for the exact assertions in `<TestPlan>`.

## Zone boundaries and conventions

- Every target is Zone A. Preserve the existing client-component boundary; do not add `'use client'` to a Server Component or modify a server file.
- Preserve strict TypeScript types. Use explicit component property interfaces and `ReactNode` for the UI slot; do not add `any`, casts, weakened types, new schemas, or a new state mechanism.
- Keep React Turnstile execution and its resolver at the form level. Passing the widget element to the final-step slot changes its rendered position, not its token, callback, or submission contract.
- Keep the existing user-visible success boundary: `prUrl` and `SuccessPanel` indicate successful submission. Turnstile verification must never be treated as contribution success.
- This follows WCAG 2.2 SC 4.1.3 by exposing changing progress as a programmatic status, and Cloudflare's documented execute-on-user-action model. These references do not authorize changing the current Turnstile execution configuration.

</Architecture>

<DataFlow>

## Form ownership, final-step rendering, and submission state

1. `ContributeForm` remains the owner of `turnstileResolver` and `executeTurnstile`. On final-step submission, the existing submit hook calls `executeTurnstile()`; the existing Turnstile `onVerify(token)` resolves that form-level promise with the token.
2. `ContributeForm` passes the unchanged Turnstile element and current `SubmissionStage` as props to `ContributeFormStepper`. The element is rendered only in the active last-step action area and is omitted after `prUrl` is set. No second widget, resolver, or token state is introduced.
3. The final step renders its instruction, submission status, widget, and submit action in that DOM order. The widget is immediately above the action; the helper makes clear that widget verification does not itself confirm receipt.
4. `useSubmitContribution` retains the existing state transitions: `idle → verification → conversion → transmission → idle with prUrl` on success, or `idle` with an error on failure. The final-step status and button label reflect the existing stage; no transition or store shape changes.
5. Turnstile success supplies the token to the existing flow, which continues conversion and sends the same request to the same API endpoint with the same `turnstileToken` field. The success panel appears only after the existing successful response sets `prUrl`.
6. On error, preserve existing form values, error display, retry entry point, and telemetry. The user may retry through the same submit action; this specification adds no retry policy or new token-expiry handling.

There is no change to server contracts, API payload shape, environment configuration, analytics events, data persistence, or authentication.

</DataFlow>

<FailureModes>

- **Turnstile verification succeeds:** This is not submission success. Continue through conversion and transmission; do not render `SuccessPanel` or set `prUrl` based on the widget callback.
- **Verification is still pending:** Keep the final button disabled under the existing `isSubmitting` behavior, show the verification status, and use `Перевіряємо…` rather than a label that implies data was already sent.
- **Conversion is underway:** Announce that verification passed and data is being prepared; do not claim the request is already being transmitted.
- **Transmission is underway:** Announce that data is being sent; do not claim receipt until the successful API response arrives.
- **The API rejects the request or the network fails:** Preserve the existing error display and retry path. Do not show the success panel, clear the user's contribution data, invent another retry mechanism, or change Turnstile error handling.
- **Turnstile does not produce a token:** Preserve the existing callback/resolver failure behavior; this UI-placement change must not add a promise timeout, error callback policy, or fallback token.
- **Submission succeeds:** Preserve the existing `prUrl`-driven success panel and widget omission. The panel is the only success confirmation in scope.
- **Widget or final action appears in an earlier step:** Treat this as a placement defect; the Turnstile slot belongs only to the active final step.
- **Mobile or dark-mode layout fails:** Keep the widget above the button in a vertical layout; do not solve overflow by moving it below the CTA or removing status copy.
- **Duplicate announcements:** Remove the old header-level `role="status"` output when the final-step status is added; announce progress once, next to the final action.
- **Scope drift:** Do not edit `use-submit-contribution.ts`, `contribution-state.ts`, API/server code, public contracts, schemas, authentication, or unrelated contribution steps.
- **Type rules:** Do not introduce casts, `any`, widened stage types, or optional values that hide missing required slot/stage wiring.

</FailureModes>

<TestPlan>

All tests are Zone A Vitest tests and run offline. Do not mount a real Cloudflare widget or issue network requests. The widget mock boundary is a typed React-node placeholder supplied to the step/stepper; the form-level resolver and verification implementation are not mocked into a different architecture.

## `src/app/components/contribute/step.test.tsx`

- Render `ContributeFormStep` in a React Hook Form context with a typed final-step definition and a Turnstile placeholder node.
- Assert the final action group's DOM order is instruction, progress status when submitting, Turnstile placeholder, then the **Подати** button.
- Assert the exact approved helper text and `role="status"` with each stage's corresponding status text.
- Assert each submission stage gives the final button its corresponding label and that the button remains disabled while submitting.
- Assert idle/non-submitting render has no submission-status announcement and retains the normal **Подати** label.
- Keep Turnstile a placeholder. Do not load Cloudflare's script, change hook ownership, or mock a successful token as a contribution success.

## `src/app/components/contribute/stepper.test.tsx`

- Render `ContributeFormStepper` with its typed form context and existing contribution/table-store test boundaries; mock PostHog capture and the `ContributeFormStep` child boundary only as needed to inspect passed props.
- Assert the Turnstile element and stage are supplied to the last step only, never to earlier steps.
- Assert the widget slot is absent after `prUrl` indicates success while the existing completion state remains driven by `prUrl`.
- Preserve existing step order, active-index, and validation behavior; do not make network requests or mount a real Turnstile widget.

## Verification

- Run the focused tests:

  ```sh
  yarn test --run src/app/components/contribute/step.test.tsx src/app/components/contribute/stepper.test.tsx
  ```

- Run `yarn typecheck` and require it to pass. Run lint for changed TypeScript/CSS targets and require it to pass.
- Browser smoke check: reach the final contribution step on desktop and a narrow mobile viewport; confirm the instruction, widget, status, and submit action are vertically ordered, that successful verification proceeds to submission without looking like final success, and that only the existing PR success panel confirms completion.
- In the diff, verify `turnstileResolver`, `executeTurnstile`, `useTurnstile()`, the `onVerify` callback, widget props, request payload, and server files remain unchanged.

</TestPlan>

## Acceptance summary

1. The Turnstile widget is rendered in the final step immediately above the submit action, never after the stepper or beside the button.
2. Approved helper copy, stage-accurate status messages, and stage-accurate button labels distinguish verification from transmission and submission success.
3. The resolver remains form-level and the current imperative verification, API request, and server contract are preserved.
4. Only the existing successful response and PR success panel confirm submission.
5. Both targeted tests and type checking pass; no Zone B file or public contract changes.
