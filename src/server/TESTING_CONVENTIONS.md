# Backend Testing Conventions

## 1. Module Resolution (CRITICAL)

- **ESM Strictness**: All relative imports targeting local source files MUST append the `.js` extension.
  _Correct:_ `import { service } from '../../src/services/file.js'`
  _Fatal:_ `import { service } from '../../src/services/file'`
- Do not append `.js` to `import type` statements.

## 2. Network & Environment Isolation

- Execute entirely offline. Zero live requests.
- Use `vi.mock()` to stub external `fetch` calls, SDKs, or database instances.
- Mock the `environment` object (`src/server/src/environment.ts`) to provide dummy secrets.

## 3. Telemetry & Assertions

- Spy on the Bugsnag utility (`expect(reportError).toHaveBeenCalled()`) for simulated network failures and unhappy paths.
- Enforce strict deep equality on normalized outputs.
- Use Zod schemas to test validation boundaries with explicitly malformed inputs.

## 4. Syntax

- Use `describe`, `it`, and `expect` from `vitest`.
- Exclusively use `vi.fn()` and `vi.spyOn()` for spying. Never import `jest`.
- You can use `any` and `unknown` types for any and unknown values.
