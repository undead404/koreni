---
description: Let authenticated contributors opt out of showing matched author emails on statically generated volunteer profiles, and rebuild the site using a private build-time visibility policy.
status: implementation-ready
targets:
  - src/app/account/page.tsx
  - src/app/account/schemata.ts
  - src/app/account/page.module.css
  - src/app/account/page.test.tsx
  - src/app/helpers/get-volunteers.ts
  - src/app/helpers/get-volunteers.test.ts
  - src/scripts/fetch-email-visibility-policy.ts
  - src/scripts/fetch-email-visibility-policy.test.ts
  - .github/workflows/main.yml
  - .gitignore
  - .env.example
  - src/server/.env.example
  - src/server/src/database/schema.sql
  - src/server/src/database/generated.ts
  - src/server/src/database/find-user-by-id.ts
  - src/server/src/database/update-user-email-visibility.ts
  - src/server/src/database/get-email-visibility-suppressions.ts
  - src/server/src/database/users.test.ts
  - src/server/src/schemata.ts
  - src/server/src/environment.ts
  - src/server/src/handlers/handle-auth-email-visibility.ts
  - src/server/src/handlers/handle-auth-email-visibility.test.ts
  - src/server/src/handlers/handle-email-visibility-policy.ts
  - src/server/src/handlers/handle-email-visibility-policy.test.ts
  - src/server/src/services/github-workflow-dispatch.ts
  - src/server/src/services/github-workflow-dispatch.test.ts
  - src/server/src/app.ts
  - src/server/src/app.test.ts
context:
  - CONVENTIONS.md
  - TESTING_CONVENTIONS.md
  - src/server/CONVENTIONS.md
  - src/server/TESTING_CONVENTIONS.md
  - specs/070-karma-source-and-sync-contract.md
  - specs/071-karma-calculation-engine.md
---

# Account Email Visibility

<Architecture>

## Goal and boundaries

Allow an authenticated contributor to control whether their matched email address is shown on statically generated volunteer profiles. Preserve their author name, indexed records, counts, account login behavior, and Karma behavior.

The identity match is exact after trimming and lowercasing. For a DB user, the matched address set is:

1. The current Google login `users.email`.
2. The manually linked `users.contribution_email`, when non-null.

Do not infer author identity from `authorName`, and do not require every `data/records/*.yaml` author to have a DB user. Unmatched metadata retains current publication behavior.

The preference governs author contact addresses on generated volunteer list/profile pages only. It does not remove account email from the authenticated account UI, edit repository YAML/CSV, hide author names, or change unrelated site contact addresses.

## Zones and exact operations

### Zone A — Next.js account UI and SSG build

- `src/app/account/page.tsx`: load the existing authenticated account plus email-visibility state; render a controlled preference; submit changes; show the required Ukrainian rebuild notice and dispatch-failure feedback.
- `src/app/account/schemata.ts`: define strict response schemas and inferred types for the visibility read/update contracts.
- `src/app/account/page.module.css`: style the preference, accessible status text, and errors.
- `src/app/helpers/get-volunteers.ts`: read the build-generated visibility policy, normalize each YAML `authorEmail`, filter contacts, and remove suppressed `authorEmail` fields from metadata returned to profile rendering.
- `src/scripts/fetch-email-visibility-policy.ts`: make one bounded authenticated request to the private policy endpoint, validate it, and write a local ignored build manifest. Do not print response bodies or addresses.
- `.github/workflows/main.yml`: add a no-input `workflow_dispatch` trigger; on **every** workflow run, including pushes, fetch the current policy before `yarn build`. Add `src/scripts/**` to the push path filters so changes to the fetch script trigger validation/deployment. The dispatch event carries no user email, preference, or suppression list. Use the existing deduplicated `main` workflow behavior; do not add a separate workflow or change its concurrency policy.
- `.gitignore`: ignore the local generated policy manifest.
- `.env.example`: document the build-only `EMAIL_VISIBILITY_SYNC_TOKEN` variable without placing its value in client-exposed configuration.

### Zone B — Hono API and SQLite

- `src/server/src/database/schema.sql`: add `show_email INTEGER DEFAULT TRUE NOT NULL` to `users`. `TRUE` preserves current behavior unless the user opts out.
- `src/server/src/database/generated.ts`: represent the SQLite column as `show_email: Generated<number>`.
- `src/server/src/database/find-user-by-id.ts`: include `show_email` in the authenticated user lookup.
- `src/server/src/database/update-user-email-visibility.ts`: update the preference by authenticated user ID only.
- `src/server/src/database/get-email-visibility-suppressions.ts`: select users with `show_email = 0`, normalize their login and non-null contribution email, deduplicate, and return the addresses required by the static build.
- `src/server/src/schemata.ts`: define the user preference and private policy response schemas.
- `src/server/src/environment.ts`: define optional `EMAIL_VISIBILITY_SYNC_TOKEN` for local/dev environments; production deploy configuration must provide a non-empty value. The policy handler returns 401 when it is unset.
- `src/server/.env.example`: document the server-side secret.
- `src/server/src/handlers/handle-auth-email-visibility.ts`: implement the authenticated read and update contract below. Derive the user ID from `TranscribeContext`; ignore client identity fields.
- `src/server/src/handlers/handle-email-visibility-policy.ts`: implement the bearer-token-protected build policy endpoint below.
- `src/server/src/services/github-workflow-dispatch.ts`: dispatch `.github/workflows/main.yml` on `main` using the existing server `GITHUB_TOKEN`; no event inputs.
- `src/server/src/app.ts`: register both authenticated account routes and the internal build-policy route.

### Proposed route contracts (fixed for this implementation)

- `GET /api/auth/email-visibility` — requires `transcribeAuthMiddleware`; returns `{ "show_email": boolean }` for the session user.
- `PUT /api/auth/email-visibility` — requires `transcribeAuthMiddleware`; accepts exactly `{ "show_email": boolean }`; returns HTTP 200 `{ "show_email": boolean, "rebuild_status": "queued" | "dispatch_failed" }`.
  - The preference is committed before workflow dispatch.
  - Every valid PUT requests a rebuild, including an idempotent same-value PUT, so a user can retry a failed dispatch without changing the preference.
  - A dispatch failure does not roll back the saved preference. It is logged and reported as `dispatch_failed` in the successful mutation response.
- `GET /api/internal/email-visibility-policy` — requires `Authorization: Bearer <EMAIL_VISIBILITY_SYNC_TOKEN>`; returns `{ "suppressed_emails": string[] }`. Reject missing, incorrect, or unconfigured credentials with HTTP 401. This endpoint is for the build runner only; do not expose it to browser clients.

`GITHUB_TOKEN` on the server must have permission to dispatch workflows (`actions:write`). The GitHub Actions build job receives `EMAIL_VISIBILITY_SYNC_TOKEN` as a secret and supplies it only to the policy-fetch step. The existing API deployment environment writer in `.github/workflows/main.yml` must write the same secret value into the server `.env`. Do not put either secret in a `NEXT_PUBLIC_*` variable.

## SSG policy manifest

The fetch script writes `.email-visibility-policy.json` at the repository root, with one of these schemas:

```json
{ "mode": "listed", "suppressed_emails": ["normalized@example.org"] }
```

```json
{ "mode": "all" }
```

The `mode: "all"` value is the fail-closed policy. The script overwrites the manifest on every invocation and does not reuse a prior run's policy. The manifest is ignored by Git and is not uploaded as a standalone artifact. The normal static output contains no suppressed addresses.

`src/app/helpers/get-volunteers.ts` is the single filtering boundary for volunteer profiles. It must filter both `volunteer.emails` and `volunteer.tables[*].authorEmail`; filtering only the visible `ContactGate` output is insufficient because profile props/metadata can be serialized into static output.

## Explicit non-goals

- No author records are imported into SQLite and no DB-to-author-name matching is added.
- No editing of `data/records/*.yaml` or `data/csv/*.csv` occurs when a preference changes.
- No dynamic request-time DB lookup is added to public pages.
- Arbitrary Next.js build/deploy failure recovery is out of scope per user approval. The fail-closed requirement below applies to policy fetch, policy validation, and manifest consumption errors.

</Architecture>

<DataFlow>

## Preference state and public projection

1. New and existing users receive `show_email = 1` from the DB default, preserving existing publication unless they opt out. OAuth upsert must omit `show_email` from its insert/update set so subsequent login email refreshes preserve the stored choice.
2. The account page loads `GET /api/auth/me` for account identity and `GET /api/auth/email-visibility` for the preference. Parse each response with its Zone A Zod schema.
3. When the user changes the control, send `PUT /api/auth/email-visibility` with only `{ show_email }`. The server takes the user ID from the authenticated session and persists the boolean as SQLite `1`/`0`.
4. After persistence, the server requests a workflow dispatch for the `main` ref with no workflow inputs. It returns `rebuild_status: "queued"` on dispatch acceptance or `"dispatch_failed"` if GitHub rejects/fails the dispatch. Do not log the preference email or include it in GitHub event data.
5. After the preference response, show exactly: `Зміни з’являться на сайті після його перебудови.` If `rebuild_status` is `dispatch_failed`, also show: `Налаштування збережено, але не вдалося запустити перебудову сайту. Повторіть збереження, щоб спробувати ще раз.` A repeated PUT retries dispatch.
6. Every `main` workflow invocation runs the policy-fetch script before `yarn build`, regardless of whether the run began from `push` or `workflow_dispatch`.
7. The fetch script requests `GET ${NEXT_PUBLIC_API_SITE}/api/internal/email-visibility-policy` with the server-only bearer token. It validates `{ suppressed_emails }`, trims and lowercases addresses, and writes `mode: "listed"` to the manifest.
8. `getVolunteers()` loads YAML metadata as it does today. In `mode: "listed"`, it compares each non-empty `authorEmail` using trim/lowercase against the suppression set. A match removes that email from the volunteer's contact list and removes the email property from that table's returned metadata. Other emails grouped under the same name remain if not suppressed. In `mode: "all"`, remove every metadata author email from volunteer profile data.
9. Next.js generates the volunteer list and profile pages with the filtered metadata. Existing frontend deployment publishes `out/`; no suppression list or setting values are transmitted in the triggering event.

## State transitions

| Event                                                                | Persisted state      | Build policy                                       | UI/result                                                |
| -------------------------------------------------------------------- | -------------------- | -------------------------------------------------- | -------------------------------------------------------- |
| User enables display                                                 | `show_email = 1`     | Address absent from suppression set                | Saved; rebuild queued or dispatch failure shown          |
| User disables display                                                | `show_email = 0`     | Login email and linked contribution email included | Saved; rebuild queued or dispatch failure shown          |
| User retries same value                                              | Unchanged preference | Latest DB projection fetched by the next build     | Dispatch is retried                                      |
| Policy endpoint succeeds with no opted-out users                     | Unchanged            | `mode: "listed"`, empty list                       | Normal email display                                     |
| Policy fetch, response validation, or manifest read/validation fails | Unchanged            | `mode: "all"`                                      | Build logs failure and omits all volunteer author emails |

The policy endpoint returns addresses for opted-out DB users only. For each such user it includes both the current login email and, if present, the manually linked `contribution_email`; it does not emit names, user IDs, or contribution records.

</DataFlow>

<FailureModes>

## Policy-fetch and policy-application failures — fail closed

- **API timeout, connection error, non-2xx response, absent/invalid token, invalid JSON, or schema mismatch:** log a sanitized error; write `{ "mode": "all" }`; continue the SSG build. Never substitute an empty suppression list.
- **Manifest missing, unreadable, or malformed when `getVolunteers()` runs:** log without contents and treat it as `mode: "all"`. Do not publish volunteer emails based on missing or invalid policy input.
- **Manifest write failure:** log and fail the workflow before `yarn build`; do not allow the build to consume a stale manifest. This is an artifact/build infrastructure failure and is within the explicitly excluded build-failure boundary; do not claim the live site was updated.
- **Policy endpoint unauthorized/unconfigured:** return 401. The caller converts this to the logged `mode: "all"` fallback; no email data is returned.
- **Malformed preference PUT:** return 400 without mutation or dispatch. Reject missing and non-boolean `show_email`; do not coerce strings/numbers.
- **Unauthenticated account read/update:** return 401; never accept a caller-supplied user ID/email.
- **Database update error:** do not dispatch; return a server error and do not claim the preference was saved.
- **GitHub dispatch error after successful DB update:** retain the saved preference; log the sanitized failure; respond with `rebuild_status: "dispatch_failed"`. UI shows the exact failure feedback above, and a repeated PUT retries.
- **Rapid preference changes / duplicate runs:** each workflow build reads current server state at build time, not event data. Preserve the repository's existing deduplication behavior as approved; do not add email-bearing inputs or custom concurrency changes.

## Out-of-scope failure boundary

An unrelated Next.js compilation/build error or deployment failure can leave the prior site deployed. Automatic emergency replacement of a failed deployment is explicitly out of scope. Do not claim that an opted-out address has disappeared from the live site until a successful rebuild/deploy. The account notice states that the change appears after rebuild; it is not a completion confirmation.

## Type and privacy rules

- SQLite stores a non-null integer flag; server contracts expose a boolean.
- Email matching is `trim().toLowerCase()` on both DB projection and indexed metadata; no substring, root, or author-name matching.
- Never print suppression addresses, the internal bearer token, or the workflow-dispatch token in logs.
- The private endpoint must not be called by browser code; do not bundle its token.
- Preserve an explicitly linked `contribution_email` when OAuth refreshes `users.email`.
- Suppress only matched addresses in listed mode; unmatched/data-only authors remain as-is. Suppress all volunteer author addresses only in fail-closed mode.

</FailureModes>

<TestPlan>

## Zone A tests

### `src/app/account/page.test.tsx`

- Use MSW to handle `/api/auth/me`, `GET /api/auth/email-visibility`, and `PUT /api/auth/email-visibility`; do not spy on global `fetch`.
- Assert the control is initialized from `show_email`, sends only `{ show_email }`, updates from the response, and shows exactly `Зміни з’являться на сайті після його перебудови.` after persistence.
- Assert `dispatch_failed` shows the saved-setting retry warning and a repeated save issues another PUT with the same value.
- Assert preference-load failure has an explicit recoverable error; `/api/auth/me` unauthorized redirects to `/account/login` as before.

### `src/app/helpers/get-volunteers.test.ts`

- Mock `@koreni/shared/get-tables-metadata` with typed metadata fixtures; use an isolated temporary policy manifest boundary.
- Listed mode: suppress an author email by normalized exact match; prove the login and linked-alias addresses both work; retain a different address under the same `authorName`; retain data-only/unmatched authors.
- Assert suppressed addresses are absent from both `emails` and every returned `tables[*].authorEmail`, while names, power, slugs, and table counts remain unchanged.
- All mode and absent/malformed policy: assert all volunteer email fields are omitted and non-email volunteer data is retained.

### `src/scripts/fetch-email-visibility-policy.test.ts`

- Mock the network with MSW and filesystem writes with a narrow `node:fs/promises` mock or temporary directory.
- Assert successful responses are parsed, normalized, and written as listed mode; error responses, timeout, invalid JSON, and invalid schema log no email/token values and write all mode.
- Assert manifest-write failure exits non-zero so a stale policy cannot be consumed.

## Zone B tests

### `src/server/src/database/users.test.ts`

- Mock the Kysely/LibSQL boundary; assert default insert leaves `show_email` to the schema default, preference update targets only the supplied authenticated user ID, and OAuth upsert preserves both visibility and manually linked contribution email.
- Assert suppression projection includes normalized login plus non-null contribution alias only for `show_email = 0`, deduplicated case-insensitively.

### `src/server/src/handlers/handle-auth-email-visibility.test.ts`

- Mock preference persistence and the workflow-dispatch service; assert GET returns a boolean, PUT rejects malformed data, and caller-supplied identity is ignored/not accepted.
- Assert the preference mutation happens before dispatch; dispatch success returns `queued`; dispatch failure retains the mutation, reports `dispatch_failed`, and logs without email/token values; same-value PUT calls dispatch again.
- Assert unauthenticated access is rejected by route middleware.

### `src/server/src/handlers/handle-email-visibility-policy.test.ts`

- Assert missing, incorrect, and unconfigured bearer token return 401 without querying the projection.
- Assert a valid token returns only `{ suppressed_emails }` and the deduplicated normalized login/contribution addresses.

### `src/server/src/services/github-workflow-dispatch.test.ts`

- Mock Octokit; assert dispatch targets `main.yml` on ref `main` with no inputs/client payload; assert GitHub rejection is propagated to the handler and reported through standard error logging.
- Never make a live GitHub request.

### `src/server/src/app.test.ts`

- Exercise route registration using Hono's in-memory request path and mocked persistence/dispatch boundaries.
- Assert authenticated GET/PUT preference routes and the private policy route are registered at their specified methods and paths; verify auth middleware rejects anonymous preference requests.

## Pipeline and acceptance verification

- Run `yarn typecheck` and the targeted frontend/server Vitest files above.
- Run `yarn build` with a valid local policy manifest and confirm volunteer output contains no opted-out addresses.
- Run a build-policy fallback test with the API unavailable and confirm generated volunteer pages contain no author email addresses.
- Inspect the workflow dispatch request fixture and workflow configuration to confirm no email/suppression values enter event inputs.
- Confirm `.email-visibility-policy.json` is ignored and is not part of `out/` or uploaded as a separate artifact.
- Before production rollout, the maintainer reviews `src/server/src/database/schema.sql` and manually applies the corresponding production DB change. Do not add an automatic production migration in this task.
- A complete Next.js, manifest-write, or deployment failure is excluded from the acceptance guarantee as specified above.

</TestPlan>

## Acceptance criteria

1. An account can opt out and opt back in, with the preference surviving Google OAuth email refreshes.
2. Public volunteer SSG filters only the exact login/contribution email identities associated with opted-out users.
3. Every build fetches policy privately at build time; workflow-trigger payloads contain no email/suppression data.
4. Policy fetch/application errors are logged and produce a successful fail-closed site build with all volunteer author emails suppressed.
5. Successful preference persistence shows the exact Ukrainian rebuild notice; dispatch failure is distinguishable and can be retried.
6. Unmatched authors retain existing publication behavior, and author names, table data, and counts are not changed.

## Hard constraints

- No source metadata is edited as a side effect of a setting change.
- Do not weaken the Zod contracts or use name-based matching.
- Do not log or expose private policy data to the browser.
- Preserve Zone A conventions. Every relative import in Zone B source/tests must append `.js`.
- No automatic schema migration is added; production DB alteration is maintainer-operated after schema review.
