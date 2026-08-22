---
description: Specify operational configuration, secret handling, scheduled ingestion, and recovery for Navigator Karma integration.
status: draft
targets:
  - karma-integration.md
  - .env.example
  - src/server/.env.example
context:
  - karma-integration.md
  - karma-discussion.txt
  - src/server/CONVENTIONS.md
---

# Karma Operational Setup & Environment Configuration

## 1. Architectural Boundary

- **Execution Context:** Deployment, Environment Configuration, & GitHub Actions Operational Workflow
- **Data Scope:** Secrets, push tokens, server authentication keys, and environment variables

---

## 2. State Transition Matrix

### Fault / Current State

- **Condition:** No environment configuration or deployment documentation exists for storing `KARMA_APP_TOKEN` and `KARMA_INTERNAL_TOKEN`.
- **Behavior:** Daily push jobs and link redemption requests fail due to missing push credentials or server access permissions.

### Target / Resolved State

- **Condition:** Environment variables configured in `.env`, `src/server/.env`, and GitHub repository secrets.
- **Behavior:**
  - `KARMA_APP_TOKEN`: Secret Bearer token obtained from Navigator administration to authenticate `/api/karma/ingest` and `/api/karma/link-redeem`.
  - `KARMA_INTERNAL_TOKEN`: Secret Bearer token used by GitHub Actions workflow to authenticate requests to Koreni server `GET /api/karma/linked-users`.
  - `NAVIGATOR_BASE_URL`: Base URL for Navigator API (default `https://www.uagenealogy.com`).
  - `KORENI_SERVER_URL`: Production URL for Koreni server instance accessed by GitHub Actions workflow.
  - Scheduled runner executes `.github/workflows/karma-daily-sync.yml` daily via GitHub Actions cron trigger.
  - **Self-Healing Recovery:** If a daily sync job fails (e.g. server HTTP error or network timeout), the subsequent run automatically syncs all current contributions statelessly, eliminating the need for manual database reconciliation.

---

## 3. Execution Pipeline

### 3.1. .env.example & src/server/.env.example

1. Add `KARMA_APP_TOKEN=`, `KARMA_INTERNAL_TOKEN=`, `NAVIGATOR_BASE_URL=https://www.uagenealogy.com`, and `KORENI_SERVER_URL=` to environment templates.

### 3.2. karma-integration.md

1. Maintain documentation describing Koreni's role:
   - Server manages user account link state (`karma_linked_at`) and exposes consented accounts via `GET /api/karma/linked-users`.
   - GitHub Actions workflow executes daily sync, reading repo source files and pushing batch updates to Navigator.

---

## 4. Hard Constraints

- **Secret Safety:** Never commit `KARMA_APP_TOKEN` or `KARMA_INTERNAL_TOKEN` values to source control; configure them strictly via environment variables or GitHub Secrets.
- **Access Restriction:** `GET /api/karma/linked-users` must reject any request without a valid `KARMA_INTERNAL_TOKEN`.
- **No Secret Exposure:** Tokens, one-time codes, and authorization headers must be excluded from logs, client bundles, and telemetry.
- **Recovery:** The next scheduled run recomputes all raw cumulative totals; no cursor, delta, or manual reconciliation state is required.

---

## 5. Agentic Verification

1. **Type & Lint Pass:**
   `yarn exec tsc --noEmit`
2. **Targeted Test Execution:**
   `yarn exec vitest`
