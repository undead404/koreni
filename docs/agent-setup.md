# Agent setup

OpenCode and OpenAI Codex share the root `AGENTS.md`, zone conventions, and `.agents/skills/koreni-*/SKILL.md` workflows. OpenCode’s `.opencode/agents` and `.opencode/commands` files are thin adapters; edit workflow behavior in the shared skill, not in both clients.

Launch either client from the repository root. No skill copying, symlinks, global installation, or Codex project configuration is required. Use the model, account, sandbox, and approval settings configured in each client. If newly added skills are absent from an existing session, start a fresh session.

## Roles

| OpenCode role        | Codex invocation                | Purpose                                    |
| -------------------- | ------------------------------- | ------------------------------------------ |
| `execute`            | `$koreni-execute <task>`        | Bounded informal implementation            |
| `plan` / `architect` | `$koreni-plan <goal>`           | Plan, then write a requested specification |
| `build`              | `$koreni-build <specification>` | Implement a resolved XML specification     |
| `investigate`        | `$koreni-investigate <defect>`  | Diagnose without edits                     |
| `verify`             | `$koreni-verify <scope>`        | Review without repairs                     |
| `vision`             | `$koreni-vision <question>`     | Explore product or architecture directions |

Skills guide the current Codex session; they do not create custom Codex agent types or change permissions. For independent verification, start a fresh review session and provide the spec and diff. OpenCode retains its existing agent configuration. Automatic delegation is not required.

## Commands

| OpenCode                             | Codex                                             |
| ------------------------------------ | ------------------------------------------------- |
| `/test`                              | `$koreni-test`                                    |
| `/test-server`                       | `$koreni-test-server`                             |
| `/lint`                              | `$koreni-lint`                                    |
| `/lint-css`                          | `$koreni-lint-css`                                |
| `/refactor <path> <goal>`            | `$koreni-refactor <path> <goal>`                  |
| `/scaffold-test <path>`              | `$koreni-scaffold-test <path>`                    |
| `/scaffold-test-server <path>`       | `$koreni-scaffold-test-server <path>`             |
| `/commit` under `execute` or `build` | `$koreni-commit` explicitly requested by the user |

For example: `$koreni-execute Fix the failing archive search test` or `$koreni-plan Add pagination to archive results`.

Commands execute through the host’s native tools after reading the workflow. Arguments are task data, not shell snippets. Tests run once rather than entering watch mode. The shared lint/refactor helper keeps its existing name, `scripts/opencode-check.sh`; it works from either client and runs both typechecks plus ESLint auto-fix. Lint commands may modify files.

Commit workflows use only already-staged changes and require explicit authorization. Reading or automatically selecting a skill never grants commit permission.

## Maintenance and validation

Keep platform-specific model and permission settings in the platform adapters. `opencode.json`, `.opencodeignore`, and OpenCode agent frontmatter are not Codex settings. Do not copy them into Codex configuration or assume their restrictions are enforced there. Shared read-only role rules still apply as instructions.

After changing workflows, validate skill YAML, check adapter targets exist, and run `git diff --check`. When the respective clients are installed, check OpenCode discovery with `opencode debug config` and inspect Codex’s skills selector in a fresh repository session. Smoke-test with a read-only request such as `$koreni-investigate Explain the search routing flow without making changes`. Static validation alone does not prove runtime model behavior.

Official format references: [Codex skills](https://learn.chatgpt.com/docs/build-skills), [OpenCode skills](https://opencode.ai/docs/skills/), and [OpenCode commands](https://opencode.ai/docs/commands/).
