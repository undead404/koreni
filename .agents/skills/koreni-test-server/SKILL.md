---
name: koreni-test-server
description: Run and repair Koreni backend Vitest tests.
---

Read `AGENTS.md` and the conventions applicable to the target paths before proceeding. Paths and shell commands below are relative to the repository root. Use the host’s native read, edit, search, and shell tools; these instructions do not grant tool permissions.

Read `src/server/TESTING_CONVENTIONS.md`. Run `CI=true yarn vitest run --bail 1` in `src/server`, or a specific test supplied by the user (relative to that directory). Read failing tests and implementations before fixing root causes. Preserve transaction boundaries, assertions, strict types, and mocked services. Re-run each affected test; stop after two failed repair cycles and report evidence. An empty suite is not proof of success.
