# Frontend Testing Conventions

## 1. Network & Environment Isolation

- **Zero Global Fetch Mocking:** Never spy on global `fetch`. Network interception must be handled exclusively via Mock Service Worker (MSW).
- **Offline Integrity:** The test environment must run entirely offline. Unhandled MSW requests must trigger a strict hard failure (`onUnhandledRequest: 'error'`).
- **SSG Context:** For static site generation tests, ensure MSW handlers reflect production caching strategies (e.g., simulating `force-cache` or `revalidate` tags) rather than generic JSON responses.
- **Environment Simulation:** Override the `environment` object (`src/environment.ts`) using `vi.stubEnv()` for standard environment variables, ensuring dummy secrets are injected before module instantiation.

## 2. Next.js App Router & React 19 Topologies

- **RSC vs. CC Boundaries:** Test React Server Components strictly for data-fetching logic and payload generation. Test Client Components strictly for interactivity (e.g., React 19 `useActionState` and `useFormStatus`). Never mount an RSC using `@testing-library/react`.
- **Router State & Synchronization:** Mock `next/navigation` via `next-router-mock`. Explicitly test URL update logic during search input synchronization to prevent debouncing race conditions. Assert against `useSearchParams` and `usePathname` strictly.
- **Form Actions:** When testing React 19 server actions passed to Client Components, wrap the mocked action in a `vi.fn()` and assert the progressive enhancement fallback state.

## 3. Telemetry, Assertions & Validation

- **Boundary Testing:** Spy on `initBugsnag().notify` to verify telemetry dispatch, but assert the UI recovery via React Error Boundaries (`error.tsx`).
- **Zod Schema Rigidity:** Do not merely test validation failures; test the shape of `safeParse` errors to ensure precise client-side feedback for malformed indexing or search inputs.
- **Deep Equality:** Enforce strict deep equality (`toStrictEqual`) over loose equality (`toEqual`) for all normalized outputs and search result sets to prevent prototype pollution or undefined property drift.

## 4. Syntax & Type Enforcement

- **Test Runner API:** Use `describe`, `it`, and `expect` exclusively from `vitest`.
- **Spying:** Exclusively use `vi.fn()` and `vi.spyOn()`. Jest imports are strictly forbidden.
- **Zero-Tolerance for `any`:** The `any` type is strictly banned. Use `unknown` for ambiguous data payloads, or leverage `DeepPartial<T>` and `ReturnType<typeof fn>` to type incomplete mocked genealogical records or query responses accurately.
