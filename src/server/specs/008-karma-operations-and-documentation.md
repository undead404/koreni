---
description: Specify environment variables, cron scheduling setup, telemetry, and privacy compliance guidelines for Navigator Karma integration.
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

- **Execution Context:** Deployment, Environment Configuration, & Operational Cron
- **Data Scope:** Secrets, push tokens, and environment variables

---

## 2. State Transition Matrix

### Fault / Current State

- **Condition:** No environment configuration or deployment documentation exists for storing `KARMA_PUSH_TOKEN`.
- **Behavior:** Daily push jobs and link redemption requests fail due to missing push credentials.

### Target / Resolved State

- **Condition:** Environment variables configured in `.env` and `src/server/.env`.
- **Behavior:**
  - `KARMA_PUSH_TOKEN`: Secret Bearer token obtained from Navigator administration.
  - `NAVIGATOR_BASE_URL`: Base URL for Navigator API (default `https://www.uagenealogy.com`).
  - Scheduled runner executes `yarn karma:push` daily.
  - Automatic error notifications sent to Bugsnag on API failures or network timeouts.

---

## 3. Execution Pipeline

### 3.1. .env.example & src/server/.env.example

1. Add `KARMA_PUSH_TOKEN=` and `NAVIGATOR_BASE_URL=https://www.uagenealogy.com` to environment templates.

### 3.2. karma-integration.md

1. Maintain documentation describing Koreni's role as a third-party service pushing scores to Navigator.

---

## 4. Hard Constraints

- **Secret Safety:** Never commit `KARMA_PUSH_TOKEN` values to source control.

---

## 5. Agentic Verification

1. **Type & Lint Pass:**
   `yarn exec tsc --noEmit`
2. **Targeted Test Execution:**
   `yarn exec vitest`
