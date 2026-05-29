---
description: [Strict, imperative description of the task or state change]
status: draft
targets:
  - [Explicit relative path to primary mutation file]
context:
  - [Explicit relative paths to interfaces, DB schemas, or Typesense configs]
---

# [Task/Bug Title]

## 1. Architectural Boundary

- **Execution Context:** [Server (Hono) | Client (Next.js & React 19) | Shared]
- **Data Scope:** [SQLite (Kysely) | Typesense Index | Local State | N/A]

---

## 2. State Transition Matrix

### Fault / Current State

- **Condition:** [Describe the exact trigger or race condition]
- **Behavior:** [Describe the invalid output or synchronization failure]
- **Log/Trace:**

```ts
// Insert minimal isolated error trace or failing DOM state
```

### Target / Resolved State

- **Condition:** [Describe the required execution trigger]
- **Behavior:** [Describe the exact data mutation or React render output]
- **Schema/Type Alteration:**

```ts
// Insert target interface, generic constraint, or expected return type
```

---

## 3. Execution Pipeline

### 3.1. [Target File Path from Frontmatter]

1. [Precise implementation directive. E.g., "Implement useActionState for form submission."]
2. [Data-handling directive. E.g., "Ensure local SQLite mutation triggers Typesense index update."]

---

## 4. Agentic Verification

Execute the following commands to validate the implementation:

1. **Type & Lint Pass:** Run standard formatting and type checks.

```bash
   /lint

```

2. **Targeted Test Execution:** Run the specific route or backend test.

```bash
   /test-route src/path/to/test.test.tsx
   # OR
   /test-server

```

3. **ESM Validation (Backend Only):**

```bash
   /verify-esm [Target File Path]

```
