---
description: Refactor rate limiter configuration mismatch and generate isolated, deterministic Vitest suite.
targets:
  - src/server/src/middlewares/rate-limiter.ts
  - src/server/src/middlewares/rate-limiter.test.ts
context:
  - src/server/src/middlewares/rate-limiter.ts
  - src/server/TESTING_CONVENTIONS.md
---

# Rate Limiter Middleware Refactor & Test

## 1. Refactoring Directives (`src/server/src/middlewares/rate-limiter.ts`)

### Configuration Alignment

- Fix the `rateLimiterIp` configuration to match the intended logic: `points: 20, duration: 900` (15 minutes).
- Fix the `rateLimiterApiKey` configuration to match the intended logic: `points: 20, duration: 3600` (1 hour).
- Remove the misleading comments once the code is self-documenting.

## 2. Unit Testing Directives (`src/server/src/middlewares/rate-limiter.test.ts`)

### Determinism & Mocking

- **Strict Mock**: Mock the `rate-limiter-flexible` module entirely using `vi.mock('rate-limiter-flexible')`. Do not use the real memory limiter, as it pollutes global test state.
- **Mock Implementation**: Provide a mock class for `RateLimiterMemory` where `.consume()` is a `vi.fn()`.
- **Environment**: Mock `@hono/node-server/conninfo` to return a static IP address.

### Hono Test App Instantiation

- Instantiate a fresh `Hono` app.
- Mount the middleware: `app.use('*', rateLimitMiddleware)`.
- Mount a dummy downstream route: `app.get('/test', (c) => c.json({ success: true }))`.
- Dispatch tests using `app.request(new Request('http://localhost/test', ...))`.

### Assertion Matrices

- **API Key Routing**: Send a request with the `x-api-key` header. Assert that the API key limiter's `consume` mock was called with the exact API key string, and the IP limiter was NOT called.
- **IP Routing (Headers)**: Send a request without an API key but with an `x-forwarded-for` header. Assert the IP limiter's `consume` mock is called with the forwarded IP.
- **IP Routing (Fallback)**: Send a request without an API key or forwarded header. Assert the IP limiter's `consume` mock is called with the IP from `getConnInfo`.
- **Rejection (429)**: Force the mocked `.consume()` to reject (`mockRejectedValue(new Error('Rate Limit Exceeded'))`). Assert the middleware catches the rejection, halts `next()`, and returns a `429` status code with the exact error payload.
