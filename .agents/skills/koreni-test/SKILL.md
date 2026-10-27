---
name: koreni-test
description: Run and repair Koreni frontend Vitest tests.
---

Read `AGENTS.md` and the conventions applicable to the target paths before proceeding. Paths and shell commands below are relative to the repository root. Use the host’s native read, edit, search, and shell tools; these instructions do not grant tool permissions.

Run `CI=true yarn vitest run` from the repository root; use a user-supplied test path as a safely quoted argument if provided. Read `TESTING_CONVENTIONS.md`. Inspect each failing test and its implementation before editing. Fix root causes without weakening assertions or types. Re-run the affected tests after fixes, with at most three execution attempts. An empty suite is not proof of success. Report commands, exit statuses, and remaining failures.
