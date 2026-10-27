---
name: koreni-lint-css
description: Repair Koreni Stylelint violations without redesigning CSS.
---

Read `AGENTS.md` and the conventions applicable to the target paths before proceeding. Paths and shell commands below are relative to the repository root. Use the host’s native read, edit, search, and shell tools; these instructions do not grant tool permissions.

Run `yarn exec stylelint "**/*.css" --fix`, retaining output and exit status. Inspect files with remaining violations before editing. Change only reported violations, preserving design, selectors, and architecture. If a fix requires a subjective design choice, report it as unresolved. Run `yarn exec stylelint "**/*.css"` to verify; command failure is never evidence of zero violations. Stop after two failed repair cycles.
