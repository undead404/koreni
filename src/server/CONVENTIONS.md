# Server Conventions

This directory contains the server-side logic, distinct from the Next.js app.

## Technology Stack

- **Framework**: Hono
- **Engine**: Node.js (^22.12), Yarn
- **Language**: TypeScript
- **Validation**: Zod
- **Error Handling**: Bugsnag

## Structure

- **src/services/**: Contains business logic and external API integrations (e.g., GitHub, Cloudflare Turnstile).
- **src/schemata.ts**: centralized Zod schemas for server-side validation.

## Coding Style

- **Imports**: Use ".js" extensions when importing local modules.
- **Validation**: Strict use of `zod` for validating external inputs (webhooks, API requests).
- **Environment Variables**: Accessed via a centralized `environment` object.
- **Async/Await**: extensive use of async functions for I/O operations.

## Key Services

- **GitHub**: Integration for dispatching repository events (`submitToGithub`).
- **Turnstile**: Captcha validation service (`validateTurnstile`).

## Testing

- Environment is Node.js 22.22.
- Vitest used for unit tests.
- Unit tests have `.test.ts` extension.
- Always try to create unit tests for all components and services.
