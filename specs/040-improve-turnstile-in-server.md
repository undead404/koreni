---
description: Refactor Turnstile validation service for architectural compliance and generate a comprehensive Vitest suite.
targets:
  - src/server/src/services/validate-turnstile.ts
  - src/server/src/services/validate-turnstile.test.ts
context:
  - src/server/CONVENTIONS.md
  - src/server/TESTING_CONVENTIONS.md
---

# Turnstile Validation Refactor & Test Spec

## 1. Refactoring Directives (`src/server/src/services/validate-turnstile.ts`)

### Payload Serialization

- Rip out `FormData`.
- Instantiate a native `URLSearchParams` object or pass a stringified JSON payload with the `Content-Type: application/json` header. Cloudflare accepts both; avoid `multipart/form-data`.

### Error Boundaries & Telemetry

- Wrap the `fetch` call and JSON parsing in a strict `try/catch` block.
- Import your centralized Bugsnag utility.
- In the `catch` block, invoke the Bugsnag reporter immediately to log the failure, then throw a structured HTTP-friendly error or return a deterministic failure state. Do not swallow the error.
- Use `turnstileResponseSchema.safeParse(outcome)` instead of `.parse()`. Evaluate the `success` boolean. If `false`, log the Zod parsing failure to Bugsnag and handle it as a rejected challenge.

## 2. Unit Testing Directives (`src/server/specs/services/validate-turnstile.test.ts`)

### Mocks & Isolation

- **Native Fetch**: Node.js 22 uses a native global `fetch`. Mock it using `vi.stubGlobal('fetch', vi.fn())` before all tests, and restore it after all.
- **Environment**: Mock the `environment` object to provide a fake `TURNSTILE_SECRET_KEY`.
- **Telemetry**: Spy on the imported Bugsnag error reporter.

### Assertion Matrices

- **Happy Path**: Mock a successful `fetch` returning a JSON payload with `{ success: true }`. Assert that the schema parses it and the function returns the validated data.
- **Network Failure**: Force `fetch` to reject (`vi.fn().mockRejectedValue(...)`). Assert that the Bugsnag reporter is called with the exact network error, and verify the function's failure output.
- **Schema Validation Failure**: Mock `fetch` to return a `200 OK`, but return a malformed JSON payload that Cloudflare did not document. Assert that `safeParse` catches the shape mismatch and routes the anomaly to Bugsnag.
