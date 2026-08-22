---
description: Specify the typed, timeout-bounded Navigator client for link redemption and cumulative ingestion.
status: draft
targets:
  - src/server/src/services/navigator-client.ts
context:
  - karma-integration.md
  - src/server/CONVENTIONS.md
---

# Navigator API Client Service

## 1. Architectural Boundary

- **Execution Context:** Shared Network Utility Service (Server Hono Handlers & GitHub Actions Scripts)
- **Data Scope:** Outgoing HTTP calls to `https://www.uagenealogy.com` API (`/api/karma/link-redeem`, `/api/karma/ingest`, `/api/karma/lookup`)

---

## 2. State Transition Matrix

### Fault / Current State

- **Condition:** Koreni codebase has no dedicated API client to communicate with Navigator (`www.uagenealogy.com`).
- **Behavior:** Cannot redeem codes or push batch ingestion updates to Navigator.

### Target / Resolved State

- **Condition:** `NavigatorClient` encapsulates all authenticated calls to `https://www.uagenealogy.com` using `Authorization: Bearer <KARMA_APP_TOKEN>`.
- **Behavior:**
  - `redeemLinkCode({ code, login, total })`: POSTs to `https://www.uagenealogy.com/api/karma/link-redeem` (used by server route during initial user account linking).
    - Handles HTTP 200 `{ "ok": true, "awarded": N }`.
    - Handles HTTP 404 `{ "error": "invalid_or_expired" }` and HTTP 409 `{ "error": "already_linked" }`.
  - `pushIngestBatch({ accounts })`: POSTs to `https://www.uagenealogy.com/api/karma/ingest` (used by GitHub Actions daily synchronization script).
    - Returns parsed `{ synced, awarded, unknown }`.
  - `lookupKarma({ service, users })`: optional public GET/POST access to `/api/karma/lookup`; it does not use the push token.

---

## 3. Execution Pipeline

### 3.1. src/server/src/services/navigator-client.ts

1. Read `KARMA_APP_TOKEN` and `NAVIGATOR_BASE_URL` (default `https://www.uagenealogy.com`) from centralized environment variables.
2. Use an injected transport boundary with a finite timeout; never expose tokens to callers or logs.
3. Parse every success and documented error response with Zod schemas from `src/schemata.ts`.
4. Map timeout, DNS, connection, and HTTP 5xx failures to typed retryable integration errors.
5. Do not retry link redemption automatically; ingestion retries are bounded and idempotent.

---

## 4. Hard Constraints

- **Backend ESM:** All relative imports must end with `.js`.
- **Zero Global Fetch Spying in Tests:** Unit tests for `navigator-client.ts` must use Vitest mocks or network abstraction.
- **Cumulative Totals:** `pushIngestBatch` sends raw nonnegative cumulative totals; it never computes deltas or coefficients.

---

## 5. Agentic Verification

1. **Type & Lint Pass:**
   `yarn exec tsc --noEmit`
2. **Targeted Test Execution:**
   `yarn exec vitest src/server/src/services/navigator-client.test.ts`
