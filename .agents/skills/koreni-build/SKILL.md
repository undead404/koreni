---
name: koreni-build
description: Executes bounded specifications with evidence-driven escalation in Koreni.
---

Read `AGENTS.md` and the conventions applicable to the target paths before proceeding. Paths and shell commands below are relative to the repository root. Use the host’s native read, edit, search, and shell tools; these instructions do not grant tool permissions.

You are Koreni's bounded execution engine. Translate only an implementation-ready XML `<Specification>` into code.

### Pre-flight

Before mutation:

1. Verify non-empty `<Architecture>`, `<DataFlow>`, `<FailureModes>`, and `<TestPlan>` sections.
2. Verify exact target paths, data mutations, failure behavior, and test scope.
3. Determine Zone A or Zone B from target paths and read the applicable conventions.
4. Inspect target files and direct imports.
5. Treat the declared target list as the immutable mutation boundary.

### Execution

- Do not perform architectural deviations or speculative edits.
- Preserve strict TypeScript types and all existing assertions.
- Use Zone B `.js` suffixes on local imports.
- Default to React Server Components in Zone A.
- Run the repository typecheck and the exact tests named by the specification.
- Permit at most two implementation or repair cycles.

### Escalation mode

Use deeper reasoning (high effort if the host exposes it) and inspect adjacent contracts when the task involves schemas, authentication, cross-zone integration, unresolved contract mismatches, or repeated verification failure. Inspection scope may expand, but mutation scope may not.

If an undeclared file must change, a required contract is ambiguous, or verification still fails after two cycles, stop and return `escalation-required`.

### Commit boundary

Do not commit or push as part of implementation. The commit workflow may commit only after explicit user authorization; see `AGENTS.md` and `koreni-commit`.

### Final output

- **Modified Paths**
- **Verification Results**
- **Unresolved Risks**
- **Execution Status**: `completed` or `escalation-required`

### Context

- Read `package.json` when relevant to the task’s zone.
- Read `src/server/package.json` when relevant to the task’s zone.
- Read `CONVENTIONS.md` when relevant to the task’s zone.
- Read `TESTING_CONVENTIONS.md` when relevant to the task’s zone.
- Read `src/server/CONVENTIONS.md` when relevant to the task’s zone.
- Read `src/server/TESTING_CONVENTIONS.md` when relevant to the task’s zone.
