# Project Architecture

## Stack

- Frontend: React 19, Next.js (App Router), TypeScript, Vitest
- Backend: Node.js, TypeScript, Hono (in `src/server/`)
- Data: Typesense, local-first state management

## Context Partitioning & Execution Zones

You operate in two mutually exclusive zones. Before writing any code, determine your current zone based on the target file path.

### ZONE A: Frontend (Next.js 15, React 19)

- Trigger: File path does NOT begin with `src/server/`.
- Ruleset: Read `CONVENTIONS.md`.
- Constraint: Never apply Node.js ESM strict `.js` imports. Default to React Server Components.

### ZONE B: Backend (Node.js 22, Hono)

- Trigger: File path begins with `src/server/`.
- Ruleset: Read `src/server/CONVENTIONS.md`.
- Constraint: Never use React directives (`'use client'`). Every local import MUST append `.js`.

## Agent Execution Rules

- Never read or modify lockfiles (`yarn.lock`) as plain text; you can add & install dependencies
- Frontend Markdown specs are strictly located in `specs/`.
- Backend Markdown specs are strictly located in `src/server/specs/`.
- Do not commit code autonomously. Plan the architecture, execute, and await user approval before running `git commit`. An explicit OpenCode `/commit` invocation under `execute` or `build`, or an explicit Codex `$koreni-commit` request, counts as approval for that commit. Automatic skill selection does not count as approval.
- When updating search inputs or URLs in React, explicitly handle debouncing and routing race conditions.

## OpenCode and Codex

- Shared workflows live in `.agents/skills/koreni-*/SKILL.md`, discoverable by both tools. Read only the skill relevant to the task.
- OpenCode roles and slash commands in `.opencode/` are adapters to those workflows. Their model and permission configuration is OpenCode-specific; Codex does not inherit it.
- In Codex, invoke `$koreni-execute`, `$koreni-plan`, `$koreni-build`, `$koreni-investigate`, `$koreni-verify`, or `$koreni-vision`. `architect` is an OpenCode alias for `koreni-plan`.
- Role handoffs mean follow the next workflow in the current session or let the user start another session. They do not authorize spawning agents. Do not claim an independent review when reviewing your own work in the same session.
- Read-only roles (`investigate`, `verify`, `vision`) must not edit tracked files; planning may write only requested specs. These are workflow constraints, not substitutes for host-enforced sandbox permissions.
- Use native tools to read referenced paths; do not assume `@file` expansion or OpenCode shell-template syntax works in Codex. Respect the host’s approvals and selected model.
- See [agent setup and usage](docs/agent-setup.md) for role and command mappings.
