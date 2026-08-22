---
description: Define domain interfaces, character weight calculation contracts, AI title detection rules, and Zod schemas for Navigator API integration.
status: draft
targets:
  - src/server/src/schemata.ts
context:
  - karma-integration.md
  - karma-discussion.txt
  - src/server/CONVENTIONS.md
---

# Karma Domain Contract & Calculation Rules

## 1. Architectural Boundary

- **Execution Context:** Shared Server & Utility Modules
- **Data Scope:** In-memory contribution calculation, Zod validation schemas, and Navigator integration payloads

---

## 2. State Transition Matrix

### Fault / Current State

- **Condition:** No standard schema or formula exists to compute user character weight from YAML/CSV source files or format payloads for Navigator (`uagenealogy.com`).
- **Behavior:** Contribution totals cannot be deterministically computed or transmitted to Navigator.

### Target / Resolved State

- **Condition:** Contribution weights are calculated directly from YAML + CSV source files in `data/`, and API payloads strictly validated via Zod schemas.
- **Behavior:**
  - **Table Weight Formula:**
    For each CSV table, read all cells:
    `table.flatten().uniq().filter(value => !!value).reduce((acc, value) => acc += `${value}`.length, 0)`
    - Empty strings and nullish values are filtered out.
    - Duplicate cell values in the table are deduplicated.
    - String length of unique non-empty cells is summed.
  - **AI Table Detection:**
    - If YAML metadata `title` starts with `"[ШІ] "` (or `"[ШI] "` using Latin 'I'), the table is flagged as AI-generated (`isAiGenerated = true`).
    - AI-generated tables receive an AI weighting factor (e.g. `0.1` or as configured).
  - **Score Conversion:**
    - Raw character score is aggregated per author email (`authorEmail`).
    - Final Karma points are calculated using the ratio: `5000 characters = 1 Karma point` (or raw total passed based on Navigator config).
  - **Navigator API Payloads:**

```ts
export const navigatorLinkRedeemPayloadSchema = z.object({
  code: z.string().min(1),
  login: z.string().email(),
  total: z.number().int().nonnegative().optional(),
});

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

### 3.1. src/server/src/schemata.ts

1. Define `navigatorLinkRedeemPayloadSchema`, `navigatorIngestPayloadSchema`, and `navigatorIngestResponseSchema`.
2. Define `TableContributionWeight` interface representing computed table metrics: `tableId`, `authorEmail`, `rawCharacters`, `uniqueCharacters`, `isAiGenerated`, `weightedScore`.

---

## 4. Hard Constraints

- **Source Integrity:** Contribution records are stored as CSV + YAML in project source (`data/`), NOT copied into SQLite.
- **Strict Parsing:** All network responses from Navigator must be validated with Zod.

---

## 5. Agentic Verification

1. **Type & Lint Pass:**
   `yarn exec tsc --noEmit`
2. **Targeted Test Execution:**
   `yarn exec vitest src/server/src/schemata.test.ts`
