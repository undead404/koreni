---
description: Check submission ID availability before users finish the contribution form
status: implementation-ready
targets:
  - src/app/schemas/api.ts
  - src/app/components/contribute/schema.ts
  - src/app/components/contribute/use-contribute-form.ts
  - src/app/components/contribute/use-contribute-form.test.tsx
  - src/app/components/contribute/check-id-availability.ts
  - src/app/components/contribute/check-id-availability.test.ts
  - src/app/components/contribute/use-id-availability.ts
  - src/app/components/contribute/use-id-availability.test.tsx
  - src/app/components/contribute/context-form.tsx
  - src/app/components/contribute/context-form.test.tsx
context:
  - src/server/specs/009-submission-id-availability.md
  - src/app/components/contribute/use-form-auto-fill.ts
  - src/app/components/contribute/step.tsx
  - src/app/components/contribute/use-submit-contribution.ts
---

# Submission ID availability — frontend

<Specification>
<Architecture>

Zone A only. Implement after companion backend specification 009. Use koreni-build for implementation; no additional planning prerequisites remain. Both specifications define the proposed public contract and failure policy explicitly for review.

- Add the response schema and inferred type to `src/app/schemas/api.ts`: `{ id: string, available: boolean }`, validating ID syntax and length as below.
- In `schema.ts`, export a reusable submission ID schema accepting 5–128 ASCII letters, digits, or hyphens, case insensitive, without trimming or changing case. Use it for `contributeFormSchema.id`, aligning the existing input registration constraints with resolver validation. Export its inferred type.
- Add `check-id-availability.ts`: typed API helper accepting ID and optional AbortSignal. Fetch GET `/api/submissions/id-availability?id=...` using URL/searchParams and centralized `environment.NEXT_PUBLIC_API_SITE`, `cache: 'no-store'`, and a five-second timeout combined with caller cancellation. Parse JSON as unknown through the response schema; require returned ID to equal requested ID exactly. Return available/taken/unavailable as a discriminated union. Caller cancellation must remain distinguishable from unavailable. No response caching or automatic retries.
- Add `use-id-availability.ts` for live field feedback. Observe the form ID, including programmatic autofill; debounce valid changes by 400 ms. Expose states idle, checking, available, taken, unavailable, each associated with the exact checked ID. Own timer/request cleanup and a generation guard.
- Update `context-form.tsx` to render that state underneath the input. Retain existing local validation errors and add `aria-invalid` for a known duplicate. Connect status/error descriptions with `aria-describedby` and a polite live status region. Use existing CSS classes; no redesign. Do not overwrite user-entered IDs or add suggested suffixes.
- Extend the resolver in `use-contribute-form.ts`: run the existing Zod resolver first, then the availability helper when validation includes ID (or the whole form), the ID is locally valid, and there are no other local errors preventing that validation. A taken result adds an RHF `id` error with type `availability`; preserve other errors. Use strict resolver types without assertions. Async field registration validation alone is insufficient because the form already uses a resolver.
- Add focused tests at all test paths listed in targets. No changes to submission stages, Turnstile, routing, stores, or submission API payloads.

Design decisions: check pending submissions as well as published records; known duplicates block continuation/submission; a failed availability check is advisory and submission remains possible. Keep exact case semantics consistent with current backend paths. Checking only Typesense or bundled data would miss pending branches, so use the backend GitHub check.

</Architecture>
<DataFlow>

1. Empty/invalid ID → idle, no HTTP request; local validation remains responsible for its error.
2. Valid ID changes → immediately discard old feedback, enter checking during the debounce, then request after 400 ms without another change.
3. Latest successful response → available or taken. Display respectively `Ідентифікатор вільний` or `Цей ідентифікатор уже зайнятий. Виберіть інший.` Checking text: `Перевіряємо ідентифікатор…`.
4. Unavailable → `Не вдалося перевірити ідентифікатор. Спробуйте ще раз або продовжте — його буде перевірено під час надсилання.` Provide a labeled `Перевірити ще раз` button of type button; explicit retry starts a fresh check for the current valid ID.
5. Continue and final submit invoke the resolver through existing RHF trigger/handleSubmit paths. Await a fresh check without debounce. Taken blocks that action and renders the same ID error; available proceeds; unavailable proceeds under the advisory policy. Do not depend on live feedback remaining mounted when steps collapse.
6. Guard resolver results against ID changes during validation: discard obsolete results and validate the current ID before accepting the action. Never approve a newer value using an older result. Final submission retains its existing server duplicate checks; the preflight does not reserve an ID.
7. Clear only obsolete availability errors when ID changes; preserve unrelated and local schema errors. No live-effect trigger loop or polling. No URL mutations or navigation are introduced.

</DataFlow>
<FailureModes>

- Abort and invalidate old work on edit, unmount, reset, or retry, including A → B → A edits. A provider ignoring cancellation must still be unable to publish stale feedback.
- Network errors, timeout, HTTP 400/429/503, invalid JSON/schema, or mismatched response ID mean unavailable, never available or taken. Cancellation caused by replacement/unmount is silent.
- A fresh final check can find a conflict after live success; block before Turnstile or POST. A conflict created after that check still reaches existing server enforcement; do not promise reservation.
- Resolver checks must settle and must not leave RHF validating/submitting flags stuck on rejection or rapid edits. Do not loop indefinitely under continuous changes; cancel the current action if no stable value can be validated and let the user retry.
- Do not send requests for locally invalid IDs, including IDs outside 5–128 characters. Do not leak provider details into UI or add analytics containing raw IDs.

</FailureModes>
<TestPlan>

- `check-id-availability.test.ts`: MSW with unhandled requests treated as errors; verify URL encoding/base origin, valid free/taken responses, malformed/mismatched responses, non-2xx, timeout, and caller abort. Never mock global fetch.
- `use-id-availability.test.tsx`: React hook harness and MSW; test debounce request count, autofill, invalid/empty skips, delayed out-of-order results, A → B → A, reset/unmount cleanup, failure and manual retry.
- `context-form.test.tsx`: FormProvider with real form setup and lightweight unrelated child mocks; assert Ukrainian feedback, accessible associations, duplicate invalid state, preserving edits and no submit from retry.
- `use-contribute-form.test.tsx`: exercise actual resolver via trigger(['id']) and handleSubmit; taken blocks both, free passes, outage permits, local errors remain, final check ignores earlier success, ID edits during in-flight validation cannot approve stale data, and checks work without ContextForm mounted. Verify the submit callback is never invoked for a confirmed duplicate.
- Run `CI=true yarn vitest run` with the four target test paths, then existing contribution step/stepper tests and `yarn typecheck`. Run targeted ESLint on changed TypeScript paths. All tests offline. No dependency installation, lockfile edits, or commits.

</TestPlan>
</Specification>
