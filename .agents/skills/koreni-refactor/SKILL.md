---
name: koreni-refactor
description: Refactor a specified Koreni file while preserving public contracts.
---

Read `AGENTS.md` and the conventions applicable to the target paths before proceeding. Paths and shell commands below are relative to the repository root. Use the host’s native read, edit, search, and shell tools; these instructions do not grant tool permissions.

Obtain the target path and refactoring goal from the user’s request; if the path is missing or nonexistent, ask for it before editing. If no goal is supplied, reduce complexity and remove dead code. Read the target and required direct dependencies. Preserve exported signatures, component props, API contracts, and strict types unless changes were explicitly requested. Do not inject `any` or assertions to bypass errors. Run `./scripts/opencode-check.sh` after editing (it also auto-fixes ESLint). Stop after two failed repair cycles and report unresolved failures.
