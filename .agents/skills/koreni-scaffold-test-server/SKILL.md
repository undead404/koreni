---
name: koreni-scaffold-test-server
description: Create and verify a unit test for a specified Koreni backend file.
---

Read `AGENTS.md` and the conventions applicable to the target paths before proceeding. Paths and shell commands below are relative to the repository root. Use the host’s native read, edit, search, and shell tools; these instructions do not grant tool permissions.

Require an existing source path under `src/server/`. Read the source, `src/server/TESTING_CONVENTIONS.md`, and relevant imported services and schemas before mocking. Create a colocated `.test.ts` file using existing mock and assertion patterns, with `.js` local imports. Isolate external dependencies; do not generate integration tests. Run `CI=true yarn vitest run <test-path-relative-to-server>` in `src/server`, safely quoting the actual path. Repair at most twice, then report results. Do not claim an empty suite passed.
