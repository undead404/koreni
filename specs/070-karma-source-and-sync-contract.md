---
description: Define the contract between source calculation, consented users, and Navigator cumulative-score ingestion.
status: draft
targets:
  - src/server/src/schemata.ts
  - src/services/karma-calculator.ts
  - src/scripts/karma-push.ts
context:
  - karma-integration.md
  - CONVENTIONS.md
---

# Karma Synchronization Workflow & Contribution Rules

## 1. Architectural Boundary

- **Execution Context:** Zone A — Repository GitHub Actions Workflow (`.github/workflows/karma-daily-sync.yml`) & Integration Sync Scripts
- **Data Scope:** Koreni server consented-users endpoint (`GET /api/karma/linked-users`), repository source files (`data/records/*.yaml` and `data/csv/*.csv`), and Navigator ingestion API (`https://www.uagenealogy.com/api/karma/ingest`)

---

## 2. State Transition Matrix

### Fault / Current State

- **Condition:** No automated workflow calculates user character weight from repository YAML/CSV source files or transmits contribution ingestion batches to Navigator (`uagenealogy.com`).
- **Behavior:** Contribution totals cannot be deterministically computed, reconciled, or sent to Navigator on a scheduled basis.

### Target / Resolved State

- **Condition:** Scheduled GitHub Actions workflow fetches consented users from Koreni server, computes raw cumulative scores from `data/` source files, and transmits a validated batch to Navigator.
- **Behavior:**
  - **Table Weight Formula:**
    For each CSV table, read all cells:
    `table.flatten().uniq().filter(value => !!value).reduce((acc, value) => acc +=`${value}`.length, 0)`
    - Empty strings and nullish values are filtered out.
    - Duplicate cell values in the table are deduplicated.
    - String length of unique non-empty cells is summed.
  - **AI Table Detection:**
    - If YAML metadata `title` starts with `"[ШІ] "` (or `"[ШI] "` using Latin 'I'), the table is flagged as AI-generated (`isAiGenerated = true`).
    - AI-generated tables receive an AI weighting factor (e.g. `0.1` or as configured).
  - **Score Contract:**
    - Raw cumulative totals are aggregated per normalized author email (`authorEmail`).
    - The raw total is sent unchanged; Navigator applies its configured coefficient and delta rules.
  - **Navigator Ingestion Zod Schemas:**

```ts
export const navigatorIngestPayloadSchema = z.object({
  accounts: z.array(
    z.object({
      login: z.string().email(),
      total: z.number().int().nonnegative(),
    }),
  ),
});

export const navigatorIngestResponseSchema = z.object({
  synced: z.number().int().nonnegative(),
  awarded: z.number().int().nonnegative(),
  unknown: z.array(z.string()),
});
```

---

## 3. Execution Pipeline

### 3.1. .github/workflows/karma-daily-sync.yml

1. Schedule cron trigger: `cron: '0 3 * * *'` (daily at 03:00 UTC).
2. Checkout repository code (`actions/checkout@v4`).
3. Setup Node.js 22 & Yarn environment.
4. Execute `yarn karma:push` passing `KARMA_APP_TOKEN`, `KARMA_INTERNAL_TOKEN`, and `SITE` configuration.

### 3.2. src/scripts/karma-push.ts

1. Fetch consented user emails from `${SITE}/api/karma/linked-users` authenticated with `KARMA_INTERNAL_TOKEN`.
2. Compute raw cumulative scores for consented users from repository `data/` source files using `calculateKarmaContributions()`.
3. Validate payload with `navigatorIngestPayloadSchema` and POST batch to `${NAVIGATOR_BASE_URL}/api/karma/ingest`.
4. Parse response with `navigatorIngestResponseSchema` and output execution log.

---

## 4. Hard Constraints

- **Privacy Directive:** Unlinked / non-consented user emails must NEVER be included in the ingestion batch payload sent to Navigator.
- **Source Integrity:** Contribution records are read strictly from repository CSV + YAML files in `data/`.
- **Self-Healing Recomputation:** Synchronization is stateless. If a daily run fails or is delayed, the subsequent run recalculates cumulative totals from fresh repo sources and server consents, preventing data drift without requiring database state tracking.
- **Navigator Semantics:** A lower total is safe to transmit; Navigator must ignore decreases and never reduce stored karma.

---

## 5. Agentic Verification

1. **Type & Lint Pass:**
   `yarn exec tsc --noEmit`
2. **Targeted Test Execution:**
   `yarn exec vitest src/services/karma-calculator.test.ts src/server/src/services/karma-push-job.test.ts`
