---
description: Implement source-based contribution calculation engine reading repository YAML and CSV files, deduplicating cell values, detecting AI titles, and aggregating total scores per author.
status: draft
targets:
  - src/services/karma-calculator.ts
context:
  - karma-integration.md
  - karma-discussion.txt
  - CONVENTIONS.md
---

# Karma Source Contribution Calculation Engine

## 1. Architectural Boundary

- **Execution Context:** Zone A — GitHub Actions Runner & Root Utility Service
- **Data Scope:** File system read operations on repository `data/records/*.yaml` and `data/csv/*.csv`

---

## 2. State Transition Matrix

### Fault / Current State

- **Condition:** No utility service reads CSV + YAML source files to compute character-based contribution weights according to the unique non-empty cell formula.
- **Behavior:** Cannot calculate fair cumulative totals for authors during account linking or daily sync execution.

### Target / Resolved State

- **Condition:** `calculateKarmaContributions()` parses all contribution tables from `data/` source files.
- **Behavior:**
  - For each table:
    - Reads YAML metadata (`authorEmail`, `authorName`, `title`, `tableFilePath`).
    - Reads CSV table contents.
    - Flattens all CSV cells, filters falsy/empty values (`filter(val => !!val)`).
    - Deduplicates values (`uniq()` / `Set`).
    - Calculates character weight: `.reduce((acc, val) => acc + `${val}`.length, 0)`.
    - Detects if `title.startsWith('[ШІ] ')` or `title.startsWith('[ШI] ')`. If AI, applies AI weighting factor (e.g. `0.1`).
    - Converts character weight to Karma points: `Math.floor(weightedChars / 5000)`.
  - Aggregates results by `authorEmail` (lowercased) and returns a map of `authorEmail -> totalKarmaPoints`.

---

## 3. Execution Pipeline

### 3.1. src/services/karma-calculator.ts

1. Read all YAML files in `data/records/` using existing helper `getTablesMetadata()`.
2. For each record, read corresponding CSV file from repository `data/`.
3. Compute unique non-empty cell character sum using `Set` and `reduce`.
4. Check title prefix for AI tag `[ШІ]`.
5. Aggregate totals per lowercased `authorEmail`.
6. Export `calculateKarmaContributions()` and `getUserKarmaContribution(email: string)`.

---

## 4. Hard Constraints

- **Zero Database Duplication:** Calculation runs dynamically against source files in the repository checkout; contribution records are not persisted in SQLite.
- **Stateless Recomputation:** Calculation is idempotent. Re-running the calculation over `data/` produces identical cumulative totals without requiring durable calculation state.

---

## 5. Agentic Verification

1. **Type & Lint Pass:**
   `yarn exec tsc --noEmit`
2. **Targeted Test Execution:**
   `yarn exec vitest src/services/karma-calculator.test.ts`
