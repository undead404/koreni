# Project Architecture

## Stack

- Frontend: React 19, Next.js (App Router), TypeScript, Vitest
- Backend: Node.js, TypeScript, Hono (in `src/server/`)
- Data: Typesense, local-first state management

## Context Partitioning & Execution Zones

You operate in two mutually exclusive zones. Before writing any code, determine your current zone based on the target file path.

### ZONE A: Frontend (Next.js 15, React 19)

- Trigger: File path does NOT begin with `src/server/`.
- Ruleset: Read `@CONVENTIONS.md`.
- Constraint: Never apply Node.js ESM strict `.js` imports. Default to React Server Components.

### ZONE B: Backend (Node.js 22, Hono)

- Trigger: File path begins with `src/server/`.
- Ruleset: Read `@src/server/CONVENTIONS.md`.
- Constraint: Never use React directives (`'use client'`). Every local import MUST append `.js`.

## Agent Execution Rules

- Never read or modify lockfiles (`yarn.lock`).
- Frontend Markdown specs are strictly located in `specs/`.
- Backend Markdown specs are strictly located in `src/server/specs/`.
- Do not commit code autonomously. Plan the architecture, execute, and await user approval before running `git commit`.
- When updating search inputs or URLs in React, explicitly handle debouncing and routing race conditions.
