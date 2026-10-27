---
name: koreni-commit
description: Create a Conventional Commit from staged Koreni changes only when the user explicitly authorizes a commit.
---

Read `AGENTS.md` and the conventions applicable to the target paths before proceeding. Paths and shell commands below are relative to the repository root. Use the host’s native read, edit, search, and shell tools; these instructions do not grant tool permissions.

Loading or selecting this skill automatically does not authorize a commit. Apply the authorization rule in `AGENTS.md` first. Never stage additional files, push, reset, amend, or rewrite history as part of this workflow.

1. Inspect `git diff --cached --stat`. If nothing is staged, report “No changes staged for commit.” and stop.
2. Read the staged diff, excluding lockfiles, generated maps, minified files, and dist output. Use targeted per-file reads if the diff is too large; do not claim a truncated review is complete.
3. Compose a Conventional Commit message: `<type>(<optional-scope>): <subject>`, with an optional body explaining why.
4. Create a temporary message file with `mktemp`, write the exact message using safe quoting or a file tool, and execute `git commit -F <message-file>`. Do not use `git commit -m`. Remove only that temporary file afterward. This also works when `.git` is a worktree pointer file.
5. Report the commit result. If a hook fails, report the failure without bypassing hooks or silently expanding scope.
