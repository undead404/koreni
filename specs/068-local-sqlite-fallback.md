---
description: Update database configuration to support local SQLite fallback for development without Turso credentials.
status: draft
targets:
  - src/server/src/database/client.ts
  - src/server/.env.example
  - src/server/src/environment.ts
  - src/server/package.json
  - src/server/src/database/init.ts
context:
  - src/server/src/database/schema.sql
---

# Local SQLite Fallback for Development

## 1. Architectural Boundary

- **Execution Context:** Server (Hono)
- **Data Scope:** SQLite (Kysely)

---

## 2. State Transition Matrix

### Fault / Current State

- **Condition:** A new developer clones the repository and attempts to start the backend locally.
- **Behavior:** The application crashes during environment variable validation because `TURSO_DATABASE_URL` is enforced as a URL and `TURSO_DATABASE_TOKEN` is a mandatory non-empty string.
- **Log/Trace:**

```ts
ZodError: [
  {
    code: 'invalid_type',
    expected: 'string',
    received: 'undefined',
    path: ['TURSO_DATABASE_URL'],
    message: 'Required',
  },
  {
    code: 'custom',
    message: 'String cannot be empty',
    path: ['TURSO_DATABASE_TOKEN'],
  },
];
```

### Target / Resolved State

- **Condition:** A new developer starts the application locally with an empty `.env` or defaults from `.env.example`.
- **Behavior:** The application falls back to a local SQLite database file (e.g., `file:local.db`) and bypasses the requirement for a Turso authentication token. The developer can initialize the local database schema using a new `db:init` script.
- **Schema/Type Alteration:**

```ts
const environmentSchema = z.object({
  // ...
  TURSO_DATABASE_URL: z.string().default('file:local.db'),
  TURSO_DATABASE_TOKEN: nonEmptyString.optional(),
});
```

---

## 3. Execution Pipeline

### 3.1. src/server/src/environment.ts

1. Modify the `TURSO_DATABASE_URL` validation in `environmentSchema` to support local file connections (e.g., `z.string()`) and provide a default value of `'file:local.db'`.
2. Update `TURSO_DATABASE_TOKEN` to be optional using `.optional()`.

### 3.2. src/server/.env.example

1. Update the example configuration to indicate that `TURSO_DATABASE_URL` and `TURSO_DATABASE_TOKEN` can be omitted for local development to use a local SQLite instance.

### 3.3. src/server/src/database/client.ts

1. Update the `createClient` configuration object to safely pass `environment.TURSO_DATABASE_TOKEN` only if it is defined, preventing validation errors from `@libsql/client` when running without a remote auth token.

### 3.4. src/server/package.json

1. Add a `"db:init"` script (e.g., `"db:init": "tsx src/database/init.ts"`) that developers can run to seed the local SQLite database file with the correct initial schema structure after cloning the project.

### 3.5. src/server/src/database/init.ts

1. Create a script that utilizes the existing `better-sqlite3` and `fs` packages.
2. The script should read the contents of `src/server/src/database/schema.sql`.
3. It should instantiate a new `Database('local.db')` and execute the SQL schema string to initialize the database structure.

---

## 4. Hard Constraints

- **Backend ESM:** All relative imports in Hono/Node.js files MUST terminate with explicit `.js` extensions.
- **Isolation:** Do not modify schemas, context files, or unrelated components not explicitly listed in the `targets` frontmatter.

---

## 5. Agentic Verification

Execute the following commands to validate the implementation:

1. **Type & Lint Pass:** Run standard formatting and type checks.

```opencode
   /lint
```

2. **Targeted Test Execution:** Run the specific route or backend test.

```opencode
   /test-server
```

3. **ESM Validation (Backend Only):**

```opencode
   /verify-esm src/server/src/database/client.ts
```
