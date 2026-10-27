---
name: koreni-scaffold-test
description: Create and verify a unit test for a specified Koreni frontend file.
---

Read `AGENTS.md` and the conventions applicable to the target paths before proceeding. Paths and shell commands below are relative to the repository root. Use the host’s native read, edit, search, and shell tools; these instructions do not grant tool permissions.

Require an existing source path outside `src/server/`. Read the source, `TESTING_CONVENTIONS.md`, and relevant imported hooks, stores, and interfaces before mocking. Create a colocated `.test.ts` or `.test.tsx` file using existing test conventions. Isolate network, navigation, and global state; do not generate integration or end-to-end tests. Run `CI=true yarn vitest run <test-path>` with the actual safely quoted path. Repair at most twice, then report results. Do not claim an empty suite passed.
