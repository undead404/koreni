---
description: Add a reusable Zone A unsaved-changes guard and apply it to account email visibility settings.
status: implementation-ready
targets:
  - src/app/providers/unsaved-changes-provider.tsx
  - src/app/providers/unsaved-changes-provider.test.tsx
  - src/app/hooks/use-unsaved-changes.ts
  - src/app/layout.tsx
  - src/app/account/page.tsx
  - src/app/account/page.module.css
  - src/app/account/page.test.tsx
  - src/app/account/components/logout-button.tsx
  - src/app/account/components/logout-button.test.tsx
context:
  - CONVENTIONS.md
  - TESTING_CONVENTIONS.md
  - specs/074-account-email-visibility.md
---

# Reusable Unsaved-Changes Guard

<Architecture>

## Goal and boundaries

Create a reusable client-side mechanism for forms to register whether they have unsaved changes. Use it on the authenticated account email-visibility form. Protect supported user-initiated same-tab transitions; do not claim complete protection for Next.js App Router history transitions that have no public cancellation API.

The account preference remains governed by `specs/074-account-email-visibility.md`. This change does not modify its API contracts, SQLite state, identity matching, static-site projection, or rebuild-dispatch semantics.

### Zone A — exact files and operations

- `src/app/providers/unsaved-changes-provider.tsx`: implement the client provider and registry of active dirty forms. Aggregate registrations so any dirty form requests one confirmation. Install and clean up the shared same-tab link handler and browser `beforeunload` handler.
- `src/app/hooks/use-unsaved-changes.ts`: expose a reusable `useUnsavedChanges(isDirty: boolean)` hook. Register/unregister the caller’s current dirty state with the provider, and return a synchronous `confirmNavigation(): boolean` function for user-initiated programmatic navigation. The hook must fail clearly if used outside its provider rather than silently skipping protection.
- `src/app/layout.tsx`: mount the provider around the application content, inside the existing provider/error-boundary composition, so account header links and future forms can participate. Keep the root layout a Server Component; the provider owns its client boundary.
- `src/app/account/page.tsx`: track the saved visibility value separately from the current checkbox draft; register the form as dirty when the values differ or its save request is pending; use the approved Ukrainian label; remove the redundant explanatory paragraph.
- `src/app/account/page.module.css`: style the save button with visible padding consistent with the existing global `.btn` treatment. Do not change unrelated buttons.
- `src/app/account/components/logout-button.tsx`: call `confirmNavigation()` before clearing Google SDK state, sending the logout request, or navigating. Cancellation must leave the current authenticated session untouched.

### Reusable guard behavior

- The provider maintains registrations per mounted form; aggregate dirty state is true while at least one registration is dirty. Registration cleanup on unmount and React Strict Mode remount must not leave stale dirty entries.
- For a dirty form, intercept eligible, same-origin, same-tab anchor activations before Next.js client navigation. Ask exactly: `У вас є незбережені зміни. Покинути сторінку без збереження?`
- On confirmation, allow the original link event to continue normally. On cancellation, prevent the route transition and retain all form state.
- Do not intercept modified clicks, non-primary clicks, links targeting another browsing context, downloads, already-cancelled events, or same-document fragment-only navigation. These actions do not discard the current form in the ordinary case.
- For cross-origin or full-document navigation, rely on the browser `beforeunload` event rather than showing both a custom click confirmation and the browser’s unload warning.
- Attach the `beforeunload` listener only while one or more forms are dirty or a protected save is pending. Call `preventDefault()` and set `returnValue` to the empty string; browsers display their own generic warning text.
- All user-initiated programmatic navigation from a form must call the hook’s `confirmNavigation()` before invoking `router.push`, `router.replace`, or an equivalent navigation action. Do not guard background/authentication redirects that are not user-initiated.

### Explicit navigation limitation

Next.js 16 App Router does not expose a public API to cancel every client-side history transition. Browser Back/Forward within the SPA may therefore bypass this guard. Do not patch private Next.js router internals, monkey-patch `history`, or report Back/Forward as protected. A document-level history transition still receives the browser `beforeunload` protection where the browser fires that event.

### Explicit non-goals

- No custom modal, autosave, persistence of drafts, or asynchronous navigation queue.
- No changes to forms other than the account email-visibility form in this implementation. Future forms opt in through the shared hook.
- No guarantee that a browser honors an unload prompt, permits custom unload text, or blocks SPA Back/Forward.
- No API, database, or public profile changes.

</Architecture>

<DataFlow>

## Form registration and navigation

1. A form computes its dirty state from its own saved baseline and draft. The account page’s dirty state is `savedShowEmail !== null && showEmail !== savedShowEmail`; while a PUT is pending, the page also registers as dirty so a user is warned before abandoning an unresolved save.
2. `useUnsavedChanges(isDirty)` registers that state with the provider. Multiple forms may register independently; one confirmation is sufficient if any active form is dirty.
3. On an eligible same-origin same-tab link activation, the provider checks aggregate dirty state. If clean, it makes no change to the event. If dirty, it synchronously displays the exact confirmation message. Cancel prevents the event’s default navigation and preserves form state; confirm lets the original link/Next.js handler proceed.
4. On full-document unload, the provider’s active `beforeunload` listener requests the browser-native warning. The browser, not the application, chooses the displayed message.
5. A user-initiated programmatic navigation calls `confirmNavigation()`. `false` means do not invoke the router; `true` means continue with the existing navigation action. Account logout must obtain confirmation before any local SDK logout or server-side session deletion.

## Account preference state transitions

| Event                                  | Saved value                  | Draft value                  | Guard state                               | UI/result                                                                  |
| -------------------------------------- | ---------------------------- | ---------------------------- | ----------------------------------------- | -------------------------------------------------------------------------- |
| Preference GET succeeds                | Set to response boolean      | Set to same response boolean | Clean                                     | Render controlled checkbox                                                 |
| User changes checkbox                  | Unchanged                    | Set to checkbox value        | Dirty                                     | Leave warning applies                                                      |
| User restores saved value              | Unchanged                    | Equals saved value           | Clean, unless PUT pending                 | No unsaved-change warning                                                  |
| PUT starts                             | Unchanged                    | Unchanged                    | Dirty while request is pending            | Save control remains disabled as today                                     |
| PUT returns a valid success response   | Set to response `show_email` | Set to response `show_email` | Clean                                     | Show existing rebuild notice; show existing dispatch warning if applicable |
| PUT fails or response validation fails | Unchanged                    | Retain draft                 | Dirty only if draft differs from baseline | Show existing save error; do not claim persistence                         |
| Eligible same-tab link, cancel         | Unchanged                    | Unchanged                    | Remains dirty                             | Stay on current route                                                      |
| Eligible same-tab link, confirm        | Unchanged                    | Unchanged                    | Form unregisters on unmount               | Continue navigation; draft is discarded                                    |
| Browser unload while dirty             | Unchanged                    | Unchanged                    | Listener requests native warning          | Browser decides whether/how to warn                                        |
| SPA Back/Forward                       | Unchanged                    | Unchanged                    | May navigate without confirmation         | Documented framework limitation                                            |

## Account wording and save presentation

- Checkbox label is exactly: `Зробити мою контактну електронну пошту загальнодоступною в профілі волонтера`.
- Remove the paragraph `Налаштуйте, чи показувати адреси, зіставлені з вашим акаунтом, у профілі волонтера.`
- Keep the existing section heading, checkbox, save action, loading/error states, rebuild notice, and dispatch-failure warning.
- Keep the save action available when the preference is clean: the existing contract intentionally allows an idempotent PUT to retry a failed workflow dispatch. Do not disable save merely because `isDirty` is false.
- A dispatch failure returned in a valid successful PUT is a saved preference, not an unsaved draft. Update the saved baseline from the response and retain the existing retry guidance.

</DataFlow>

<FailureModes>

## Guard and navigation failures

- **Provider missing:** `useUnsavedChanges` outside `UnsavedChangesProvider` must throw a descriptive development/runtime error; it must not silently treat the form as clean.
- **Registration lifecycle leak:** unregister a form on unmount and replace its state on updates. A stale registration must not cause warnings after the form is gone; cleanup/re-registration must also work under Strict Mode.
- **Clean form:** do not call `window.confirm` or request a `beforeunload` warning when no registered form is dirty.
- **Cancelled link or programmatic navigation:** do not invoke navigation, logout SDK mutation, or session DELETE. Preserve the draft.
- **Confirmed navigation:** allow the requested action exactly once. Do not synthesize a second navigation or accidentally submit the preference form.
- **Modified/new-context/download link:** do not block the current page’s form, because the current browsing context is not being replaced.
- **External/full-document navigation:** use only the native unload warning; do not stack an application confirmation and browser confirmation.
- **Back/Forward in the Next.js SPA:** not guaranteed to be interceptable through public App Router APIs. Keep this limitation documented and do not introduce unsupported router/history interception.
- **Confirmation API unavailable or suppressed:** treat a false confirmation result as cancellation. Do not navigate or mutate authentication state.

## Preference and save failures

- **Preference load fails:** retain the current recoverable load-error behavior. Do not register a dirty form before a known saved baseline exists.
- **PUT fails, response JSON is invalid, or response schema validation fails:** retain the previous saved baseline and the user’s draft; show the existing save error. Dirty state follows the draft/baseline comparison after the pending request ends.
- **PUT hangs:** while the request remains pending, keep the form protected as dirty. Do not introduce an automatic retry or claim it was saved.
- **PUT succeeds with `rebuild_status: "dispatch_failed"`:** update both saved and draft values from the response, clear dirty state, and show the existing dispatch-failure message. The server contract commits the preference before workflow dispatch.
- **Idempotent retry while clean:** preserve the current ability to submit the same value to retry workflow dispatch. During that pending PUT, unload protection is active; after a valid response, the preference remains clean.
- **User confirms leaving while PUT is pending:** allow departure after confirmation; do not claim cancellation or rollback of a request already sent.

## Type and convention rules

- Keep the provider, hook, and account UI strictly typed; do not use `any` or type assertions.
- Preserve the root layout as a Server Component; only the provider/hook consumers requiring state or browser event listeners are client-side.
- Do not alter email-visibility request/response schemas or Zone B code. No `.js` import requirements arise for these Zone A targets.
- All new UI copy remains hardcoded Ukrainian, consistent with Zone A conventions.

</FailureModes>

<TestPlan>

## `src/app/providers/unsaved-changes-provider.test.tsx`

- Mount a minimal test consumer using `useUnsavedChanges` within the provider and ordinary same-origin anchors. Mock `window.confirm` with `vi.fn()`; do not make network requests or spy on global `fetch`.
- Assert clean state allows a link click without confirmation and does not request unload prevention.
- Assert dirty state displays the exact Ukrainian prompt; a false response prevents default navigation and a true response permits the original event.
- Assert modified clicks, non-primary clicks, `_blank` links, download links, cancelled events, and fragment-only same-document links are not custom-prompted.
- Assert external/full-document transitions rely on `beforeunload` and do not also invoke the custom link prompt.
- Assert `beforeunload` is prevented only while aggregate state is dirty; confirm registrations from two forms remain dirty until both are clean/unmounted.
- Assert registration cleanup and state replacement across rerender/unmount; include a provider-missing hook test for the descriptive error.
- Assert the documented SPA Back/Forward limitation in the test description/documentation; do not write a test that claims it is guarded.

## `src/app/account/page.test.tsx`

- Use MSW for `/api/auth/me` and email-visibility GET/PUT requests; do not mock global `fetch`. Mount the account page inside `UnsavedChangesProvider`.
- Assert the exact new checkbox label and that the redundant explanatory paragraph is absent.
- Assert initial GET initializes both saved and draft state; changing the checkbox makes the guard dirty; restoring the original value clears it.
- Assert a valid successful PUT updates the saved baseline and clears dirty state, while preserving the existing rebuild notice.
- Assert `dispatch_failed` still means the preference was saved and clean, while the existing retry warning remains visible and a repeated same-value save remains available.
- Assert failed request or malformed response keeps the draft, preserves dirty state when it differs from baseline, and displays the existing save error.
- Assert save pending state is protected; after success it is clean, and after request failure the dirty state follows the retained draft.
- Assert the save button has the intended CSS module class; assert surrounding account controls remain unchanged.

## `src/app/account/components/logout-button.test.tsx`

- Mock the account guard’s confirmation result and Google SDK logout boundary; use MSW for `DELETE /api/auth/session/current`, and do not spy on global `fetch`.
- When confirmation is false, assert `googleLogout`, `DELETE /api/auth/session/current`, and `router.replace` are not called.
- When confirmation is true, assert existing logout operations run once and navigation targets `/account/login`.

## Integration and verification

- Verify `src/app/layout.tsx` mounts one provider around app content without converting the root layout into a Client Component or changing metadata, header, footer, or notification behavior.
- Run the targeted Vitest files above and `yarn typecheck`.
- Run lint for the changed TypeScript/CSS files and `yarn lint:css` as applicable.
- Manually verify account same-tab links, logout, tab reload/close, and a clean form. Verify Back/Forward is not represented as guaranteed protection.
- Confirm email-visibility request payloads, endpoint paths, server behavior, and static profile projection remain unchanged.

</TestPlan>

## Acceptance criteria

1. The account setting uses the specified affirmative public-visibility label and no longer shows the redundant explanatory paragraph.
2. The save action has visible padding and retains its existing clean-state retry capability.
3. Forms can register dirty state through a reusable hook backed by one application-level provider.
4. Eligible same-tab links, user-initiated programmatic navigation, and browser unloads are guarded while one or more forms are dirty; cancelling preserves draft state.
5. Account logout does not mutate local or server authentication state before leave confirmation.
6. Successful preference persistence clears dirty state, including workflow-dispatch failure; failed/ambiguous saves retain the draft and do not claim success.
7. The known App Router SPA Back/Forward limitation is explicit; no private framework internals or history monkey-patching are added.
8. No API, database, static output, or Zone B behavior changes.
