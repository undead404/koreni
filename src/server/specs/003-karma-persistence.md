---
description: Specify SQLite schema changes in users table to persist user Navigator account link state and synchronization timestamps.
status: draft
targets:
  - src/server/src/database/schema.sql
  - src/server/src/database/generated.ts
context:
  - karma-integration.md
  - src/server/CONVENTIONS.md
---

# Karma Account Link Persistence

## 1. Architectural Boundary

- **Execution Context:** Server (Hono / SQLite via Kysely)
- **Data Scope:** `users` table schema extension

---

## 2. State Transition Matrix

### Fault / Current State

- **Condition:** Koreni's `users` table stores `id`, `google_id`, `email`, `is_admin`, `token_version`. It does NOT track whether a user has linked their account with Navigator (`uagenealogy.com`).
- **Behavior:** Daily synchronization cannot filter only opted-in, linked users, risking privacy violations.

### Target / Resolved State

- **Condition:** Add `karma_linked_at` (integer/text nullable) column to `users` table.
- **Behavior:**
  - `karma_linked_at IS NULL`: User has not linked account with Navigator. User's contributions are NEVER included in daily `/api/karma/ingest` push.
  - `karma_linked_at IS NOT NULL`: User successfully redeemed code via Navigator `link-redeem`. User's calculated cumulative contribution total is sent during daily sync.

---

## 3. Execution Pipeline

### 3.1. src/server/src/database/schema.sql

1. Add column `karma_linked_at text` (or integer timestamp) to `users` table definition.

### 3.2. src/server/src/database/generated.ts

1. Update `Users` interface in `generated.ts` to include `karma_linked_at: string | null`.

---

## 4. Hard Constraints

- **No Contribution Storage in DB:** Contributions remain strictly in CSV + YAML source files in `data/`. DB only stores user link state.
- **Backend ESM:** All relative imports must end with `.js`.

---

## 5. Agentic Verification

1. **Type & Lint Pass:**
   `yarn exec tsc --noEmit`
2. **Targeted Test Execution:**
   `yarn exec vitest src/server/src/database/users.test.ts`
