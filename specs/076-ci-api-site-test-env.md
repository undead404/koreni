---
description: Supply a valid API base URL to the frontend test step in the main GitHub Actions workflow.
status: implementation-ready
targets:
  - .github/workflows/main.yml
context:
  - src/app/environment.ts
  - src/app/account/page.test.tsx
  - src/app/account/components/logout-button.test.tsx
  - TESTING_CONVENTIONS.md
  - specs/075-reusable-unsaved-changes-guard.md
---

# Fix the Frontend Test API URL in CI

<Architecture>

## Goal and boundaries

The frontend test step in `.github/workflows/main.yml` sets `NEXT_PUBLIC_SITE` to the non-URL placeholder `site`, but omits `NEXT_PUBLIC_API_SITE`. `src/app/environment.ts` therefore falls back to `NEXT_PUBLIC_SITE`; account test modules pass the resulting string to `new URL(...)` and fail during module initialization before their tests execute.

Supply a valid synthetic API origin to the frontend test process. Keep the change limited to the test-step environment mapping. Do not change application code, test code, API contracts, account or logout behavior, backend configuration, build configuration, secrets, or workflow ordering.

## Zones and exact operations

### Zone A — `.github/workflows/main.yml`

- In the existing `Run frontend tests` step (`yarn test --run`), add `NEXT_PUBLIC_API_SITE: https://api.example.test` to that step's `env` mapping.
- Keep `NEXT_PUBLIC_SITE: site` and all existing test variables unchanged. The new value is a non-production test origin and must not be sourced from a GitHub secret or production variable.
- Scope the variable to this frontend test step only. Do not add it to the server-test step, workflow/job-wide environment, policy-fetch step, build step, or API deployment configuration.

### Zone A consumers — verification only

- `src/app/account/page.test.tsx` derives the MSW origin from `environment.NEXT_PUBLIC_API_SITE` at module initialization.
- `src/app/account/components/logout-button.test.tsx` constructs its MSW logout URL from the same environment value at module initialization.
- These test files are not mutation targets. Preserve their existing imports, URL construction, MSW handlers, and assertions.

### Zone B

No Zone B paths or operations. The Hono API, server environment, authentication routes, and server tests are outside this defect boundary.

## Alternatives and trade-offs

- **Selected:** Supply the synthetic URL at the workflow step that invokes the frontend tests. This fixes the missing CI input at its source with one narrowly scoped configuration change.
- **Not selected:** Adding a URL fallback to shared Vitest setup or stubbing the environment in account tests. Those approaches broaden test harness behavior or require managing module-initialization order; neither is needed when the workflow can provide the documented input directly.
- **Not selected:** Replacing the tests' environment-derived endpoints with hard-coded endpoints. That would weaken alignment between the configured client API origin and the MSW test boundary.

</Architecture>

<DataFlow>

## Test environment and URL construction

1. GitHub Actions starts the existing frontend test step with its current dummy variables and the added `NEXT_PUBLIC_API_SITE=https://api.example.test`.
2. The test setup loads dotenv as it does today. In CI, the explicit step environment value is available before test modules are imported and is not replaced by `.env`.
3. `src/app/environment.ts` selects the explicit `NEXT_PUBLIC_API_SITE` before considering the `NEXT_PUBLIC_SITE` fallback. The effective API origin is therefore an absolute URL even though `NEXT_PUBLIC_SITE` remains `site`.
4. `src/app/account/page.test.tsx` derives the auth and email-visibility MSW URLs from that origin. `src/app/account/components/logout-button.test.tsx` derives the logout MSW URL from it.
5. Vitest imports the account modules, constructs valid endpoint URLs, and runs the existing assertions. Runtime requests continue to be intercepted by MSW; no network call to `api.example.test` is intended.

## State and contract changes

- The only mutation is one environment entry on one existing workflow step.
- No persisted state, browser state, API request/response schema, authentication contract, or application behavior changes.
- No new retry, URL-normalization mechanism, environment fallback, mock boundary, or dependency is introduced.

</DataFlow>

<FailureModes>

## Environment and execution failures

- **Variable omitted or placed on a different step:** The frontend test process still falls back to `NEXT_PUBLIC_SITE=site`; both account suites fail at URL construction. Keep the entry in the exact `Run frontend tests` step.
- **Variable empty:** The environment module falls back to `NEXT_PUBLIC_SITE`; do not configure an empty value.
- **Value is malformed or relative:** `new URL(...)` may throw or resolve differently; use exactly the absolute synthetic origin `https://api.example.test`.
- **Production origin substituted:** Do not use `${{ vars.SITE }}`, credentials, or a live service URL for these offline tests. The origin is test configuration, not a deployment setting.
- **MSW does not handle a request:** Preserve the existing strict unhandled-request failure. Do not allow real network fallback or weaken MSW handling.
- **Workflow YAML or environment indentation is invalid:** The workflow must remain valid YAML and the key must be nested under the frontend test step's `env` block.
- **Unrelated suite failure:** Do not change other test environments, application code, or test behavior to compensate. Report unrelated failures separately.

## Type, privacy, and scope rules

- This is a YAML-only Zone A change; do not introduce TypeScript changes or backend `.js` imports.
- Do not expose or add credentials/secrets. The test origin is a public synthetic URL.
- Do not change the existing `NEXT_PUBLIC_SITE` value or any public API contract.
- Do not edit any path outside the declared `targets`.

</FailureModes>

<TestPlan>

## Targeted frontend tests

Run the exact failing suites with the new CI origin and the frontend test variables:

```bash
NEXT_PUBLIC_API_SITE=https://api.example.test \
NEXT_PUBLIC_GITHUB_OWNER=owner \
NEXT_PUBLIC_GITHUB_REPO=repo \
NEXT_PUBLIC_TYPESENSE_SEARCH_KEY=typesense-search-key \
NEXT_PUBLIC_TYPESENSE_HOST=typesense-host \
NEXT_PUBLIC_SITE=site \
NEXT_PUBLIC_OAUTH_CLIENT_ID=oauth-client-id \
yarn test --run src/app/account/page.test.tsx src/app/account/components/logout-button.test.tsx
```

- `src/app/account/page.test.tsx`: retain MSW boundaries for `/api/auth/me` and email-visibility GET/PUT requests. Assert the existing account, auth redirect, preference, save, and failure-path tests execute and pass; no module-load `Invalid URL` error is permitted.
- `src/app/account/components/logout-button.test.tsx`: retain MSW for `DELETE /api/auth/session/current` and the existing Google logout/router mocks. Assert the cancellation and confirmed-logout tests execute and pass; no module-load `Invalid URL` error is permitted.
- Do not spy on global `fetch`, perform live requests, or change the existing strict MSW unhandled-request policy.

## Workflow-equivalent full suite

- Run `yarn test --run` using the updated `Run frontend tests` step environment in `.github/workflows/main.yml`.
- Assert the complete frontend suite finishes successfully, including both account test files. The failure must not be hidden by skips, test filtering, relaxed MSW handling, or altered workflow ordering.
- Inspect the workflow diff to confirm the new key is under only the frontend test step and that all other variables, steps, and jobs remain unchanged.

</TestPlan>

## Acceptance criteria

1. The frontend test step provides `NEXT_PUBLIC_API_SITE=https://api.example.test`.
2. The two account test modules construct their MSW URLs successfully with the existing environment module and `NEXT_PUBLIC_SITE=site` still present.
3. Both targeted account test files and the full frontend Vitest suite pass under the workflow test environment.
4. No account test, application, backend, API contract, build/deploy environment, secret, workflow order, or unrelated path is modified.
5. All test requests remain MSW-intercepted; no real network access is introduced.
