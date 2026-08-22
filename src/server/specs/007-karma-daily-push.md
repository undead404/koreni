---
description: Implement daily batch synchronization job pushing cumulative scores of opted-in linked users to Navigator via POST /api/karma/ingest.
status: draft
targets:
  - src/server/src/services/karma-push-job.ts
  - package.json
context:
  - karma-integration.md
  - karma-discussion.txt
  - src/server/CONVENTIONS.md
---

# Karma Daily Push Synchronization Job

## 1. Architectural Boundary

- **Execution Context:** Scheduled Cron / CLI Task (`yarn karma:push`)
- **Data Scope:** Database query for linked users (`karma_linked_at IS NOT NULL`), calculation engine, Navigator API client

---

## 2. State Transition Matrix

### Fault / Current State

- **Condition:** No scheduled process calculates current cumulative scores from `data/` source files and pushes updates to Navigator.
- **Behavior:** User scores on Navigator remain static after initial account linking.

### Target / Resolved State

- **Condition:** Execution of `yarn karma:push` triggers `runKarmaDailyPushJob()`.
- **Behavior:**
  - Queries SQLite `users` table for all users where `karma_linked_at IS NOT NULL`.
  - Calculates current cumulative score for each linked user using `calculateKarmaContributions()`.
  - Filters out unlinked users (guaranteeing unlinked user emails are NEVER transmitted).
  - Constructs payload: `{ "accounts": [ { "login": "ivan@example.com", "total": 130 }, ... ] }`.
  - Calls `navigatorClient.pushIngestBatch({ accounts })`.
  - Logs results (`synced`, `awarded`, `unknown`) and reports any unexpected errors to Bugsnag.

---

## 3. Execution Pipeline

### 3.1. src/server/src/services/karma-push-job.ts

1. Query linked user emails from database.
2. Calculate total scores from CSV/YAML source files.
3. Transmit batch to Navigator API via `navigatorClient`.
4. Output structured console log.

### 3.2. package.json

1. Add npm script: `"karma:push": "tsx src/server/src/scripts/karma-push.ts"`.

---

## 4. Hard Constraints

- **Privacy Directive:** Unlinked user emails must NEVER be included in the ingestion batch payload sent to Navigator.
- **Backend ESM:** Relative imports in backend scripts must end with `.js`.

---

## 5. Agentic Verification

1. **Type & Lint Pass:**
   `yarn exec tsc --noEmit`
2. **Targeted Test Execution:**
   `yarn exec vitest src/server/src/services/karma-push-job.test.ts`
