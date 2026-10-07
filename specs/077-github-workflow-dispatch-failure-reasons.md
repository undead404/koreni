---
description: Log sanitized GitHub workflow-dispatch failure reasons while preserving the email-visibility API contract.
status: implementation-ready
targets:
  - src/server/src/schemata.ts
  - src/server/src/schemata.test.ts
  - src/server/src/services/github-workflow-dispatch.ts
  - src/server/src/services/github-workflow-dispatch.test.ts
  - src/server/src/handlers/handle-auth-email-visibility.test.ts
context:
  - specs/074-account-email-visibility.md
  - src/server/CONVENTIONS.md
  - src/server/TESTING_CONVENTIONS.md
  - src/server/src/logger.ts
  - src/server/src/logger.test.ts
---

# GitHub Workflow Dispatch Failure Reasons

<Architecture>

## Goal and boundaries

Make the reason for a failed GitHub workflow dispatch visible in structured API logs without exposing the workflow-dispatch token, email addresses, request headers, or an unbounded/raw response body. Preserve the existing email-visibility behavior: save first, dispatch second, return HTTP 200 with `rebuild_status: "queued" | "dispatch_failed"`, and allow a later same-value PUT to retry.

The change is Zone B only. It does not identify or change the production token's permissions, modify GitHub repository settings, retry dispatch automatically, or change the account UI, database schema, routes, API response, workflow configuration, deployment behavior, or Bugsnag's generic error report.

## Exact files and operations

### Zone A — no changes

- No Zone A target. In particular, leave `src/app/account/page.tsx` and `src/app/account/page.test.tsx` unchanged; their request and feedback contract is already specified by `specs/074-account-email-visibility.md`.

### Zone B — Hono API server

- `src/server/src/schemata.ts`: define and export Zod schemas and inferred types for the unknown exception envelope, response envelope, HTTP status, GitHub error response `message`, and bounded GitHub request ID. Parse optional diagnostic fields independently so an invalid status or request ID does not discard a valid reason; do not use type assertions or `any`.
- `src/server/src/services/github-workflow-dispatch.ts`: retain the existing Octokit call to `main.yml` on `main` with no inputs. On rejection, parse only the supported diagnostic fields, normalize and redact the reason, and write them as structured fields on `dependency.github.workflow_dispatch_failed`. Keep Bugsnag reporting generic and throw the existing generic `GitHub workflow dispatch failed` error.
- `src/server/src/handlers/handle-auth-email-visibility.test.ts`: retain regression assertions for persistence-before-dispatch and the unchanged `dispatch_failed` response; add or adjust an assertion only if needed to prove diagnostics do not change handler behavior.

All relative imports in Zone B source and tests must use mandatory `.js` extensions. Use the existing `logger.error(event, fields)` interface. Do not pass an `Error` object, raw Octokit error, or unparsed response object to the logger: the logger serializes `Error.message`, and arbitrary reason strings are not automatically scrubbed for email addresses.

</Architecture>

<DataFlow>

## Dispatch failure data and state transitions

1. `handlePutAuthEmailVisibility` continues to persist the authenticated user's `show_email` before calling `dispatchGithubWorkflow`. A successful DB update remains committed if dispatch fails.
2. The dispatch service catches the thrown value as `unknown` and parses it using the schemas exported from `src/server/src/schemata.ts`.
3. Parse the exception/response envelopes as objects, then validate each optional field independently. When the exception contains a GitHub HTTP response, derive:
   - `github_status`: a validated integer from 100 through 599, preferring the response status and otherwise using the validated top-level status;
   - `reason`: a non-empty trimmed string from `response.data.message`, falling back to a non-empty trimmed exception message;
   - `github_request_id`: the `x-github-request-id` response header, looked up case-insensitively and accepted only as a non-empty string of at most 128 characters.
4. For errors without a valid GitHub response, use the validated exception message as the reason. If no safe message can be derived, use the fixed text `Unknown GitHub workflow dispatch error`. Do not fabricate an HTTP status or request ID.
5. Before logging `reason`, apply these sanitizers in order: replace occurrences of the configured `GITHUB_TOKEN` with `[REDACTED_TOKEN]`; replace matches of `/\bBearer\s+[^\s,;]+/gi` with `[REDACTED_TOKEN]`; replace key/value credentials matching `/\b(?:authorization|token|access_token|api_key|password|secret)(\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi` with the key, separator, and `[REDACTED]`; replace GitHub token strings matching `/\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g` with `[REDACTED_TOKEN]`; replace email addresses matching `/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi` with `[REDACTED_EMAIL]`; replace CR/LF and other control characters with spaces; trim and cap the result at 500 characters. If sanitization leaves no reason, use the fixed unknown-reason text. This sanitizer applies to the message selected in steps 3–4, not to arbitrary response data.
6. Emit `dependency.github.workflow_dispatch_failed` with only the available validated `github_status`, `github_request_id`, and sanitized `reason` fields. Never log the entire exception, response body, request URL, complete request/response header collections, or dispatch parameters. The validated `github_request_id` is the only permitted value extracted from response headers.
7. Report the existing generic `GitHub workflow dispatch failed` error to Bugsnag and rethrow that same generic error. The handler catches it, logs `account.email_visibility.workflow_dispatch_failed`, returns `{ show_email, rebuild_status: "dispatch_failed" }` with HTTP 200, and leaves the saved preference intact. Successful dispatch behavior and response are unchanged.

| Dispatch outcome              | Persisted preference | Dependency log                                                    | Public PUT result              |
| ----------------------------- | -------------------- | ----------------------------------------------------------------- | ------------------------------ |
| GitHub accepts dispatch       | Saved                | No failure event                                                  | HTTP 200, `queued`             |
| GitHub responds with an error | Saved                | Validated status, sanitized reason, optional request ID           | HTTP 200, `dispatch_failed`    |
| Network/unstructured error    | Saved                | Sanitized reason or fixed fallback; no invented status/request ID | HTTP 200, `dispatch_failed`    |
| Database update fails         | Not claimed saved    | No dispatch failure event; dispatch is not attempted              | Existing server-error response |

</DataFlow>

<FailureModes>

- **HTTP status missing or invalid:** omit `github_status`; continue reporting a valid sanitized reason or the fixed fallback. If response status is invalid but top-level status is valid, use the top-level status.
- **GitHub response body absent, malformed, or without a non-empty string `message`:** do not log the body or Zod issue details. Fall back to the validated exception message, then to `Unknown GitHub workflow dispatch error`.
- **Request ID absent, non-string, empty, or longer than 128 characters:** omit `github_request_id`; do not fail dispatch handling.
- **Exception is not an object, is not an `Error`, or has no usable message:** log the fixed fallback reason, report/rethrow the generic error, and preserve the handler's existing `dispatch_failed` behavior.
- **Message contains private material:** redact configured `GITHUB_TOKEN`, bearer/access-token patterns, email addresses, and control characters before logging; cap at 500 characters. Never log `error.message` directly or rely on the structured logger to redact free-form message values.
- **Logger or sanitizer failure:** contain extraction/sanitization failure and use the fixed fallback reason. The existing logger already contains writer failures; any diagnostic-path failure must not change externally visible dispatch failure behavior, and the service still reports and throws the generic failure.
- **GitHub API deprecation warning:** do not interpret or log the warning as the dispatch failure reason. It is not the rejected request's error response and changing endpoints is out of scope.
- **Privacy and contract:** never include the user preference, user identity, suppression list, or client payload in dispatch diagnostics. Do not change HTTP status, response fields, DB ordering, or retry behavior.
- **Production configuration cause:** insufficient token permissions, invalid token, missing workflow, and repository access remain operational possibilities, not assumed causes. The new fields expose the response evidence; they do not mutate secrets or grant permissions.

</FailureModes>

<TestPlan>

## Exact tests and mock boundaries

### `src/server/src/schemata.test.ts`

- Assert accepted parsing of a GitHub error envelope containing integer status, a non-empty response `message`, and a bounded request ID.
- Assert invalid response status falls back to valid top-level status; malformed/missing status, non-string or empty message, and malformed/over-limit request IDs are omitted independently without discarding other valid diagnostic fields or throwing.
- Assert unknown response-body fields do not become part of the parsed diagnostic output.

### `src/server/src/services/github-workflow-dispatch.test.ts`

- Keep the Octokit SDK mocked with `vi.mock`; tests must make no live GitHub requests. Spy on the existing structured logger and Bugsnag helper using `vi.fn`.
- For a mocked GitHub HTTP rejection, assert `dependency.github.workflow_dispatch_failed` contains the status, response message as `reason`, and request ID, while preserving the generic Bugsnag report and generic thrown error.
- Include an error message containing the configured mock token and an email address; assert neither value appears anywhere in the logger calls, Bugsnag calls, or thrown error. Assert the logged reason has control characters removed and is capped at 500 characters.
- For a transport/unstructured rejection, assert the safe exception message is logged with no fabricated status/request ID. For a non-Error or malformed response, assert the fixed fallback reason is used and the service still rejects generically.
- Keep the successful-dispatch assertion exact: workflow `main.yml`, ref `main`, no inputs.

### `src/server/src/handlers/handle-auth-email-visibility.test.ts`

- Assert preference mutation precedes dispatch; dispatch rejection retains the mutation and returns HTTP 200 `{ show_email, rebuild_status: "dispatch_failed" }`; repeated same-value PUTs still call dispatch again.
- Assert handler-level logging remains generic and contains no preference email/token values.

## Verification

- Run `yarn exec vitest run --root src/server src/schemata.test.ts src/services/github-workflow-dispatch.test.ts src/handlers/handle-auth-email-visibility.test.ts`.
- Run `yarn typecheck`.
- Inspect the structured log fixture to confirm only validated/allowlisted fields appear. No test may access production secrets or perform a live network call.

</TestPlan>

## Acceptance criteria

1. When GitHub returns an API error, production logs expose its validated HTTP status and sanitized provider reason, plus a request ID when available.
2. For failures without a GitHub response, logs expose a sanitized exception reason or fixed fallback without inventing provider metadata.
3. Tokens, email addresses, raw response bodies, headers, workflow inputs, and raw exception objects/messages are not emitted.
4. The email-visibility endpoint's persistence ordering, HTTP 200 failure response, and same-value retry behavior remain unchanged.
5. All targeted offline tests and server typechecking pass.
