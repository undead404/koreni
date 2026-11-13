---
description: Expose a read-only submission ID availability endpoint backed by GitHub
status: implementation-ready
targets:
  - src/server/src/app.ts
  - src/server/src/app.test.ts
  - src/server/src/schemata.ts
  - src/server/src/handlers/handle-submission-id-availability.ts
  - src/server/src/handlers/handle-submission-id-availability.test.ts
  - src/server/src/services/submission-id-availability.ts
  - src/server/src/services/submission-id-availability.test.ts
  - src/server/README.md
context:
  - specs/084-submission-id-availability.md
  - src/server/src/services/github.ts
  - src/server/src/services/github-readiness.ts
  - src/server/src/middlewares/rate-limiter.ts
---

# Submission ID availability — API

<Specification>
<Architecture>

Zone B only. Implement with koreni-build before frontend spec 084. Public contract and advisory failure policy are explicitly proposed in these companion specifications. This endpoint does not change authentication of any existing route, perform writes, reserve IDs, or require database/schema migrations.

- `app.ts`: register GET `/api/submissions/id-availability` with a thin dedicated handler, existing CORS/security/logging and `/api/*` rate limiting. Like `/api/ready`, it is public and read only, without apiAuthMiddleware or Turnstile.
- `schemata.ts`: add query schema `{ id: string }` requiring 5–128 ASCII letters, digits, or hyphens, case insensitive. Export inferred query type. Add minimal Zod schemas for successful GitHub reference/content responses and an inferred availability response type. Preserve importPayloadSchema's existing submission contract.
- New handler: parse query via safeParse before service invocation. Return the statuses below with `Cache-Control: no-store` on all handler responses. Do not send provider error bodies to clients.
- New service: use centralized environment and the existing GitHub REST fetch pattern from github-readiness.ts. Check the configured repository for `heads/submission/{id}` and `data/records/{id}.yaml` at explicit `ref=main`, matching existing submission conflict checks. Encode repository/path components safely. Use read-only GET requests and a shared five-second deadline; no GitHub writes. Every local runtime import must end in `.js`.
- README: document endpoint, validation, response shapes/statuses, rate limits, advisory nature, and lack of reservation.
- Do not refactor github.ts or existing submit error handling. No dependency changes.

</Architecture>
<DataFlow>

GET `/api/submissions/id-availability?id=dako-1-1-example`:

- Valid query and either exact submission ref or main record exists: 200 `{ "id": "dako-1-1-example", "available": false }`.
- Both reads return 404: 200 `{ "id": "dako-1-1-example", "available": true }`.
- Missing, repeated, empty, malformed, or out-of-bounds ID: 400 `{ "error": "invalid_id" }`. Reject repeated `id` parameters explicitly. Do not trim or lowercase IDs.
- Indeterminate dependency result: 503 `{ "error": "availability_unavailable" }`.
- Existing rate limiter retains its current 429 response contract.

Perform reads concurrently within the deadline. Validate successful responses: reference must match `refs/heads/submission/{id}` with a nonempty SHA; contents must be a file at the exact expected record path. Either validated existence is sufficient for taken, even if the other read fails. Free requires two definitive 404 responses. Otherwise unavailable. No positive or negative result cache and no automatic retries; concurrent calls remain bounded by the existing rate limiter. Frontend debouncing bounds normal typing traffic.

</DataFlow>
<FailureModes>

- Treat GitHub 401/403/429/5xx, redirect, network failure, invalid response shape, unexpected ref/path/type, or timeout as dependency failure, never as absence. Disable fetch redirects. Cancel outstanding work when the deadline expires.
- Report dependency failures through reportError using a sanitized error, including when another read establishes taken. Do not log tokens, headers, or provider response bodies. Do not duplicate reporting in handler and service.
- Validate repository configuration before requests. Missing/invalid owner/repo produces unavailable and sanitized telemetry.
- An availability result is a point-in-time observation. Existing submission branch and main-record checks remain authoritative. Case is preserved; no change to existing case collision semantics is included.
- Public visibility follows the existing readiness endpoint pattern; no credentials enter client code and the response exposes only the requested ID and boolean.

</FailureModes>
<TestPlan>

- `submission-id-availability.test.ts`: mock environment and intercept/mock service-local external calls according to backend testing conventions. Assert both 404 → free; branch exists → taken; record exists → taken; both exist; one exists plus other failure → taken with telemetry; 404 plus dependency failure → unavailable; invalid successful bodies; timeout; redirects; malformed repository config. Assert main ref, exact paths, case preservation, read-only requests, and sanitized reportError calls.
- `handle-submission-id-availability.test.ts`: Hono test app with mocked service; valid 200 free/taken, invalid/missing/repeated query 400 without service calls, service unavailable 503, exact response shapes and no-store headers.
- `app.test.ts`: mock new service/handler boundary consistently with existing route tests; ensure public GET is wired without API key or Turnstile and existing rate-limit/CORS behavior remains intact.
- Run from `src/server`: `CI=true yarn vitest run src/services/submission-id-availability.test.ts src/handlers/handle-submission-id-availability.test.ts src/app.test.ts src/services/github.test.ts`. Then root `yarn typecheck` and targeted ESLint for changed backend TypeScript paths. All tests offline; no real GitHub or database activity.

</TestPlan>
</Specification>
