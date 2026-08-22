---
description: Define strict Zod contracts for linked-user export and all Navigator karma integration payloads.
status: draft
targets:
  - src/server/src/schemata.ts
context:
  - karma-integration.md
  - src/server/CONVENTIONS.md
---

# Karma Server Domain Contract

## 1. Architectural Boundary

- **Execution Context:** Server Domain Contracts (Zone B - Hono Server)
- **Data Scope:** Validation schemas for consented users API responses and Navigator integration payloads.

---

## 2. State Transition Matrix

### Fault / Current State

- **Condition:** No server schemas exist in `schemata.ts` to validate exported consented user accounts or Navigator integration payloads.
- **Behavior:** Server endpoints and external sync tools cannot validate input/output payloads deterministically.

### Target / Resolved State

- **Condition:** Server schemas strictly validate payloads for consented user list queries (`GET /api/karma/linked-users`) and Navigator link redemption.
- **Behavior:**
  - **Zod Schemas:**

```ts
export const karmaLinkedUserSchema = z.object({
  email: z.string().email(),
  karma_linked_at: z.string(),
});

export const karmaLinkedUsersResponseSchema = z.object({
  users: z.array(karmaLinkedUserSchema),
});

export const navigatorLinkRedeemPayloadSchema = z.object({
  code: z.string().min(1),
  login: z.string().email(),
  total: z.number().int().nonnegative().optional(),
});

export const navigatorLinkRedeemResponseSchema = z.object({
  ok: z.literal(true),
  awarded: z.number().int().nonnegative(),
});

export const navigatorIngestPayloadSchema = z.object({
  accounts: z.array(
    z.object({
      login: z.string().email(),
      total: z.number().int().nonnegative(),
    }),
  ),
});

export const navigatorIngestResponseSchema = z.object({
  synced: z.number().int().nonnegative(),
  awarded: z.number().int().nonnegative(),
  unknown: z.array(z.string()),
});
```

---

## 3. Execution Pipeline

### 3.1. src/server/src/schemata.ts

1. Export all linked-user, link-redemption, ingestion, and documented Navigator error schemas.

---

## 4. Hard Constraints

- **Strict Parsing:** All network inputs and internal API responses on the server must be validated with Zod.
- **Backend ESM:** All relative imports in server files must end with `.js`.
- **Decoupled Workflow:** Account linking route handling (`POST /api/karma/link`) and database state modifications belong to subsequent persistence and account linking specs.

---

## 5. Agentic Verification

1. **Type & Lint Pass:**
   `yarn exec tsc --noEmit`
2. **Targeted Test Execution:**
   `yarn exec vitest src/server/src/schemata.test.ts`
