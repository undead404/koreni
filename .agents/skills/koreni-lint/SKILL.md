---
name: koreni-lint
description: Repair Koreni TypeScript and ESLint failures.
---

Read `AGENTS.md` and the conventions applicable to the target paths before proceeding. Paths and shell commands below are relative to the repository root. Use the host’s native read, edit, search, and shell tools; these instructions do not grant tool permissions.

Run `./scripts/opencode-check.sh` and capture its exit status and output. This shared helper runs both typechecks and ESLint auto-fix; it may modify files. If it succeeds, report that result. Otherwise read the reported files and direct type dependencies before editing. Fix only the underlying violations; never bypass errors with `any`, assertions, suppression comments, or disabled lint rules. Re-run checks after corrections. Stop after two failed repair cycles and report remaining failures.
