# AI Server Coding Conventions

## 1. Hono API Architecture

- **Route Handlers**: Keep route definitions thin. Extract all business logic, external API calls, and heavy processing into standalone functions within `src/services/`.
- **Context Handling**: Extract necessary data (headers, body, query) from the Hono Context object (`c`) at the route level. Do not pass `c` into the `src/services/` layer.

## 2. Module Resolution (Strict ESM)

- **File Extensions**: You MUST append `.js` to all relative imports for local files (e.g., `import { processWebhook } from './services/github.js'`). Omitting the extension will cause immediate runtime crashes in Node.js ESM.
- **Directory Imports**: Do not import directories (e.g., `import { X } from './services'`). Always target the specific file.

## 3. Validation & Schemas

- **Centralized Definition**: Import all validation schemas strictly from `src/schemata.ts`. Do not define inline Zod schemas within route handlers.
- **Strict Parsing**: All incoming webhooks, payloads, and query parameters MUST be parsed using `.parse()` or `.safeParse()`. Never bypass validation using type assertions (`as`).

## 4. Service Integrations & Error Handling

- **Environment State**: Access secrets and configuration strictly via the centralized `environment` object. Never use `process.env` directly.
- **External Network Calls (GitHub, Turnstile)**:
  - Isolate external calls in `src/services/`.
  - Always wrap network requests in `try/catch` blocks.
  - On failure, immediately report the error to Bugsnag using your standard error handling utility before returning an appropriate HTTP status code to the client.

## 5. Testing Execution (Vitest)

- **Coverage Mandate**: Every new file created in `src/services/` MUST have a corresponding `.test.ts` file generated alongside it.
- **Network Isolation**: Always mock external service modules (GitHub, Turnstile) or use network interception when writing tests. Tests must never execute live HTTP requests.
- **Syntax**: Use standard Vitest syntax (`describe`, `it`, `expect`).
