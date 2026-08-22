---
description: Specify the executable daily orchestration that pushes consented raw cumulative totals to Navigator.
status: draft
targets:
  - .github/workflows/karma-daily-sync.yml
  - src/scripts/karma-push.ts
  - package.json
context:
  - karma-integration.md
  - karma-integration.md
  - CONVENTIONS.md
---

# Karma Daily Push Synchronization Workflow

## 1. Architectural Boundary

- **Execution Context:** Zone A — Scheduled GitHub Actions Workflow (`.github/workflows/karma-daily-sync.yml`) & CLI Runner Script (`yarn karma:push`)
- **Data Scope:** Server consented-users API (`GET /api/karma/linked-users`), repository source files (`data/records/*.yaml` and `data/csv/*.csv`), Navigator API client (`POST /api/karma/ingest`)

---

## 2. State Transition Matrix

### Fault / Current State

- **Condition:** No scheduled GitHub Actions workflow calculates current cumulative scores from `data/` source files and pushes updates to Navigator.
- **Behavior:** User scores on Navigator remain static after initial account linking.

### Target / Resolved State

- **Condition:** Daily cron trigger in GitHub Actions executes `yarn karma:push`.
- **Behavior:**
  - Workflow fetches list of linked user emails from Koreni server via `GET /api/karma/linked-users` using `KARMA_INTERNAL_TOKEN`.
  - Calculates current raw cumulative contribution total for each linked user from repository `data/` source files using `calculateKarmaContributions()`.
  - Filters out unlinked users (guaranteeing unlinked user emails are NEVER transmitted to Navigator).
  - Constructs payload: `{ "accounts": [ { "login": "ivan@example.com", "total": 130 }, ... ] }`.
  - Transmits batch to Navigator API: `navigatorClient.pushIngestBatch({ accounts })`.
  - Logs results (`synced`, `awarded`, `unknown`).
  - **Self-Healing Failure Recovery:** If a daily run fails or is skipped, the next execution recomputes raw cumulative totals from fresh repo sources and server consents.

---

## 3. Execution Pipeline

### 3.1. .github/workflows/karma-daily-sync.yml

1. Configure scheduled trigger: `cron: '0 3 * * *'` (runs daily at 03:00 UTC).
2. Checkout repository code (`actions/checkout@v4`).
3. Setup Node.js 22 & Yarn environment.
4. Execute `yarn karma:push` with secrets `KARMA_PUSH_TOKEN`, `KARMA_INTERNAL_TOKEN`, and `KORENI_SERVER_URL`.

### 3.2. src/scripts/karma-push.ts

1. Fetch consented user emails from `${KORENI_SERVER_URL}/api/karma/linked-users` with `Authorization: Bearer ${KARMA_INTERNAL_TOKEN}`.
2. Calculate raw cumulative totals from local repository CSV/YAML files for linked emails.
3. Transmit batch to Navigator API via `navigatorClient`.
4. Output structured console log without emails or secrets and exit 0 on success.

### 3.3. package.json

1. Add npm script: `"karma:push": "tsx src/scripts/karma-push.ts"`.

---

## 4. Hard Constraints

- **Privacy Directive:** Unlinked user emails must NEVER be included in the ingestion batch payload sent to Navigator.
- **Stateless Synchronization:** The workflow must calculate scores statelessly from repository source files on each run rather than storing sync counters in the database.
- **Idempotency:** Repeating an identical batch is safe because Navigator calculates only positive deltas.
- **Retry Boundary:** Do not automatically retry one-time link redemption; bounded retries are permitted only for ingestion transport failures.
- **Zone A Context:** Imports follow standard TypeScript conventions without forcing backend ESM `.js` extensions.

---

## 5. Agentic Verification

1. **Type & Lint Pass:**
   `yarn exec tsc --noEmit`
2. **Targeted Test Execution:**
   `yarn exec vitest`
