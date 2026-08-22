---
description: Implement POST /api/karma/link endpoint for logged-in users to submit a Navigator one-time code and link their Koreni account.
status: draft
targets:
  - src/server/src/handlers/handle-karma-link.ts
  - src/server/src/services/karma-link-flow.ts
context:
  - karma-integration.md
  - src/server/CONVENTIONS.md
---

# User Account Link Handler

## 1. Architectural Boundary

- **Execution Context:** Server Route Handler (Hono)
- **Data Scope:** User session, Navigator API client, SQLite `users` table update

---

## 2. State Transition Matrix

### Fault / Current State

- **Condition:** Koreni user cannot submit a one-time challenge code obtained from Navigator (`https://www.uagenealogy.com/karma/connections`).
- **Behavior:** No route exists to link user's Koreni email with Navigator.

### Target / Resolved State

- **Condition:** Logged-in user submits `{ "code": "AB12CD34EF" }` to `POST /api/karma/link`.
- **Behavior:**
  - Authenticates user session (extracts `user.email`).
  - Calls `getUserKarmaContribution(user.email)` to compute user's current cumulative score from `data/` source files.
  - Calls Navigator API client `redeemLinkCode({ code: "AB12CD34EF", login: user.email, total: calculatedTotal })`.
  - On Navigator success (`{ ok: true }`):
    - Updates local `users` record setting `karma_linked_at = NOW()`.
    - Responds HTTP 200 `{ "ok": true, "awarded": awardedKarma }`.
  - On Navigator failure (e.g. 404 `invalid_or_expired` or 409 `already_linked`):
    - Passes status and error message through to client.

---

## 3. Execution Pipeline

### 3.1. src/server/src/services/karma-link-flow.ts

1. Implement `executeUserAccountLink({ userId, email, code })`.
2. Compute total score from source CSV/YAML files for `email`.
3. Call `navigatorClient.redeemLinkCode`.
4. Update `karma_linked_at` timestamp in SQLite DB on success.

### 3.2. src/server/src/handlers/handle-karma-link.ts

1. Protect route with user authentication middleware.
2. Extract user ID and email from context.
3. Validate request payload (`code`).
4. Invoke `executeUserAccountLink`.

---

## 4. Hard Constraints

- **Backend ESM:** All relative imports must end with `.js`.
- **Privacy Enforcement:** Account is only marked as linked upon verified confirmation from Navigator.

---

## 5. Agentic Verification

1. **Type & Lint Pass:**
   `yarn exec tsc --noEmit`
2. **Targeted Test Execution:**
   `yarn exec vitest src/server/src/handlers/handle-karma-link.test.ts src/server/src/services/karma-link-flow.test.ts`
