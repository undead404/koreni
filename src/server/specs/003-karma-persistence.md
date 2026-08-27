---
description: Specify SQLite schema changes in users table to persist user Navigator account link state and endpoint for exporting consented users to GitHub Actions workflow.
status: draft
targets:
  - src/server/src/database/schema.sql
  - src/server/src/database/generated.ts
  - src/server/src/environment.ts
  - src/server/src/handlers/handle-karma-linked-users.ts
  - src/server/src/app.ts
context:
  - karma-integration.md
  - src/server/CONVENTIONS.md
---

# Karma Account Link Persistence & Consented Users Endpoint

## 1. Architectural Boundary

- **Execution Context:** Server (Hono / SQLite via Kysely)
- **Data Scope:** `users` table schema extension, environment variables configuration, and authenticated internal query handler for GitHub Actions workflow.

---

## 2. State Transition Matrix

### Fault / Current State

- **Condition:** Koreni's `users` table stores `id`, `google_id`, `email`, `is_admin`, `token_version`. It does NOT track whether a user has linked their account with Navigator (`uagenealogy.com`), nor does an endpoint exist to query opted-in accounts.
- **Behavior:** Daily synchronization cannot filter only opted-in, linked users, risking privacy violations.

### Target / Resolved State

- **Condition:** Add `karma_linked_at` (text nullable ISO timestamp) column to `users` table and implement `GET /api/karma/linked-users`.
- **Behavior:**
  - `karma_linked_at IS NULL`: User has not linked account with Navigator. User's email is NEVER returned by `GET /api/karma/linked-users`.
  - `karma_linked_at IS NOT NULL`: User successfully redeemed code via Navigator link flow (in subsequent spec 006). Email and timestamp are returned to authorized caller.
  - `GET /api/karma/linked-users`: Protected by Bearer token authentication (`KARMA_INTERNAL_TOKEN`). Returns `{ "users": [ { "email": "user@example.com", "karma_linked_at": "..." } ] }`.
  - Rejects unauthorized or unauthenticated requests with HTTP 401.

---

## 3. Execution Pipeline

### 3.1. src/server/src/database/schema.sql

1. Add column `karma_linked_at text` to `users` table definition.

### 3.2. src/server/src/database/generated.ts

1. Update `Users` interface in `generated.ts` to include `karma_linked_at: string | null`.

### 3.3. src/server/src/environment.ts

1. Add `KARMA_INTERNAL_TOKEN` to environment schema (non-empty string, optional in non-production or validated).

### 3.4. src/server/src/handlers/handle-karma-linked-users.ts

1. Expose `GET /api/karma/linked-users` protected by Bearer token check (`KARMA_INTERNAL_TOKEN`).
2. Query `users` table where `karma_linked_at IS NOT NULL`.
3. Validate and return JSON matching `karmaLinkedUsersResponseSchema`.

### 3.5. src/server/src/app.ts

1. Register `GET /api/karma/linked-users` route handler in Hono app.

---

## 4. Hard Constraints

- **No Contribution Storage in DB:** Contributions remain strictly in CSV + YAML source files in `data/`. DB only stores user link state.
- **Privacy Enforcement:** Endpoint MUST require authentication token (`KARMA_INTERNAL_TOKEN`) to prevent exposing user link lists publicly.
- **Backend ESM:** All relative imports must end with `.js`.
- **Account Linking Separation:** Account linking logic (`POST /api/karma/link`) and setting `karma_linked_at` upon code redemption are deferred to the subsequent account linking spec (`006-karma-link-redeem-flow.md`).

---

## 5. Agentic Verification

1. **Type & Lint Pass:**
   `yarn exec tsc --noEmit`
2. **Targeted Test Execution:**
   `yarn exec vitest src/server/src/database/users.test.ts src/server/src/handlers/handle-karma-linked-users.test.ts`
