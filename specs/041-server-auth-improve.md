---
description: Refactor auth middleware to prevent stream consumption and generate an isolated Vitest suite.
targets:
  - src/server/src/middlewares/auth.ts
  - src/server/src/middlewares/auth.test.ts
context:
  - src/server/src/middlewares/auth.ts
  - src/server/TESTING_CONVENTIONS.md
---

# Auth Middleware Refactor & Test Spec

## 1. Refactoring Directives (`src/server/src/middlewares/auth.ts`)

### Stream Safety

- Do not consume `c.req.json()` directly.
- Read the body safely by cloning the request: `const body = await c.req.raw.clone().json().catch(() => ({}));`.

### Error Boundaries

- Replace `.parse()` with `.safeParse()`.
- If `.safeParse()` fails to validate the structure, immediately return a `400 Bad Request` before checking the token. Do not throw an unhandled exception.

## 2. Unit Testing Directives (`src/server/specs/middlewares/auth.test.ts`)

### Hono Test App Instantiation

- Do not manually mock the Hono `Context` object (`c`) or `next`. It is brittle.
- Instantiate a fresh `Hono` app inside the test file.
- Mount the middleware: `app.use('*', authMiddleware)`.
- Mount a dummy downstream route: `app.post('/test', (c) => c.json({ success: true }))`.
- Dispatch tests using Hono's native `app.request(new Request(...))`.

### Mocks & Environment

- **Dependencies**: Use `vi.mock()` to isolate `../services/posthog.js`, `../services/validate-turnstile.js`, `../helpers/is-valid-api-key.js`, and `../helpers/get-client-identifier.js`.
- **Environment**: Mock `environment.NODE_ENV` to toggle between `production` and `development`. Mock `@hono/node-server/conninfo` to return a static IP.

### Assertion Matrices

- **Bypass (Valid API Key)**: Mock `isValidApiKey` to return `true`. Assert the request reaches the dummy route (200 OK) without calling Turnstile.
- **Bypass (Non-Production)**: Set `NODE_ENV` to `development`. Mock `isValidApiKey` to `false`. Assert the request reaches the dummy route (200 OK).
- **Missing Token**: In `production` with no API key, send a payload without a token. Assert a 400 response and verify `posthog.capture` is called with the `turnstile_token_missing` event.
- **Validation Failure**: Mock `validateTurnstile` to return `{ success: false, 'error-codes': ['timeout-or-duplicate'] }`. Assert a 403 response and verify `posthog.capture` receives the exact error codes.
- **Happy Path**: In `production` with no API key, provide a valid token. Mock `validateTurnstile` to return `{ success: true }`. Assert the request reaches the dummy route (200 OK).
