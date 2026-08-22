---
description: Implement outgoing API client for interacting with Navigator (https://www.uagenealogy.com) endpoints using Bearer token authentication.
status: draft
targets:
  - src/server/src/services/navigator-client.ts
context:
  - karma-integration.md
  - src/server/CONVENTIONS.md
---

# Navigator API Client Service

## 1. Architectural Boundary

- **Execution Context:** Server Network Service
- **Data Scope:** Outgoing HTTP calls to `https://www.uagenealogy.com` API (`/api/karma/link-redeem`, `/api/karma/ingest`, `/api/karma/lookup`)

---

## 2. State Transition Matrix

### Fault / Current State

- **Condition:** Koreni backend has no dedicated API client to communicate with Navigator (`www.uagenealogy.com`).
- **Behavior:** Cannot redeem codes or push batch ingestion updates to Navigator.

### Target / Resolved State

- **Condition:** `NavigatorClient` encapsulates all network calls to `https://www.uagenealogy.com` using `Authorization: Bearer <KARMA_PUSH_TOKEN>`.
- **Behavior:**
  - `redeemLinkCode({ code, login, total })`: POSTs to `https://www.uagenealogy.com/api/karma/link-redeem`.
    - Handles HTTP 200 `{ "ok": true, "awarded": N }`.
    - Handles HTTP 404 `{ "error": "invalid_or_expired" }` and HTTP 409 `{ "error": "already_linked" }`.
  - `pushIngestBatch({ accounts })`: POSTs to `https://www.uagenealogy.com/api/karma/ingest`.
    - Returns parsed `{ synced, awarded, unknown }`.
  - `lookupKarma({ service, users })`: GET/POST to `https://www.uagenealogy.com/api/karma/lookup`.

---

## 3. Execution Pipeline

### 3.1. src/server/src/services/navigator-client.ts

1. Read `KARMA_PUSH_TOKEN` and `NAVIGATOR_BASE_URL` (defaults to `https://www.uagenealogy.com`) from centralized `environment`.
2. Wrap `fetch` calls in try/catch and parse responses with Zod schemas from `src/schemata.ts`.
3. Report network/telemetry errors to Bugsnag on 500/network failure.

---

## 4. Hard Constraints

- **Backend ESM:** All relative imports must end with `.js`.
- **Zero Global Fetch Spying in Tests:** Unit tests for `navigator-client.ts` must use Vitest mocks or network abstraction.

---

## 5. Agentic Verification

1. **Type & Lint Pass:**
   `yarn exec tsc --noEmit`
2. **Targeted Test Execution:**
   `yarn exec vitest src/server/src/services/navigator-client.test.ts`
