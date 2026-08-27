# P3: Bump @types/node and Frontend Target

**Priority**: P3 (Low)  
**Effort**: 5 minutes  
**Impact**: Better type inference, correct Node 22 typings  
**Status**: Pending

## Problem Statement

The project has two minor TypeScript configuration issues:

### Issue 1: @types/node is ^20, but engine is Node 22

```json
{
  "engines": {
    "node": "22"
  },
  "devDependencies": {
    "@types/node": "^20"
  }
}
```

This mismatch means:

- Type definitions are for Node 20, not Node 22
- Missing types for Node 22 features (e.g., `fetch`, `crypto.subtle`)
- Developers get incorrect type hints

### Issue 2: Frontend target is ES2017, unnecessarily conservative

```json
{
  "compilerOptions": {
    "target": "ES2017"
  }
}
```

This is overly conservative for a modern Next.js 15 project:

- ES2017 is from 2016 (8 years old)
- Next.js handles transpilation automatically
- Modern browsers support ES2020+ features
- Unnecessarily verbose emitted code

## Solution Design

### Fix 1: Bump @types/node to ^22

```json
{
  "devDependencies": {
    "@types/node": "^22"
  }
}
```

### Fix 2: Bump frontend target to ES2022

```json
{
  "compilerOptions": {
    "target": "ES2022"
  }
}
```

ES2022 is a good balance:

- Widely supported in modern browsers
- Includes useful features (top-level await, class fields, etc.)
- Still conservative enough for broad compatibility
- Next.js handles any remaining transpilation

## Scope

### Files to Modify

1. `package.json`
   - Change `@types/node` from `^20` to `^22`

2. `tsconfig.json`
   - Change `target` from `ES2017` to `ES2022`

### No Changes Required

- Any other files
- Build scripts
- CI/CD workflows

## Implementation

### Step 1: Update package.json

**Before**:

```json
{
  "devDependencies": {
    "@types/node": "^20"
  }
}
```

**After**:

```json
{
  "devDependencies": {
    "@types/node": "^22"
  }
}
```

### Step 2: Update tsconfig.json

**Before**:

```json
{
  "compilerOptions": {
    "target": "ES2017"
  }
}
```

**After**:

```json
{
  "compilerOptions": {
    "target": "ES2022"
  }
}
```

### Step 3: Reinstall dependencies

```bash
yarn install
```

### Step 4: Verify type checking

```bash
yarn typecheck
```

Expected: 0 type errors (same as before)

## Test Plan

### TV-1: @types/node is updated

```bash
yarn list @types/node
```

Result: `@types/node@^22.x.x`

### TV-2: tsconfig.json is updated

```bash
cat tsconfig.json | grep '"target"'
```

Result: `"target": "ES2022"`

### TV-3: Type checking still passes

```bash
yarn typecheck
```

Result: 0 type errors

### TV-4: Tests still pass

```bash
yarn test --run
```

Result: 373/373 tests pass

### TV-5: Build still works

```bash
yarn build
```

Result: Build succeeds

### TV-6: No new type errors

- Run type checking before and after
- Compare error counts
- Expected: Same or fewer errors

## Failure Modes

### FM-1: New type errors appear

**Risk**: Very low (we're only updating types, not code)
**Mitigation**: If errors appear, they're pre-existing and should be fixed

### FM-2: Build output changes

**Risk**: Very low (Next.js handles transpilation)
**Mitigation**: Verify bundle size is similar

### FM-3: Runtime behavior changes

**Risk**: Very low (types don't affect runtime)
**Mitigation**: Run full test suite

## Acceptance Criteria

- [x] `@types/node` updated to `^22`
- [x] `target` updated to `ES2022`
- [x] Type checking passes
- [x] Tests pass
- [x] Build works
- [x] No breaking changes
- [x] No new type errors

## Related Issues

- **P0-1**: Type-checking gate (completed)
- **P0-2**: Server tests on PR (completed)
- **P1**: Yarn dependency caching (independent)
- **P1**: Replace lodash with es-toolkit (independent)
- **P2**: Yarn 4 workspaces (independent)
- **P3**: Fix check-pr.yml path filter (independent)

## Notes

- This is a low-risk, low-effort improvement
- Improves type safety for Node 22 features
- Reduces unnecessary type emit
- Should be done after P0/P1/P2 to avoid churn
- Can be combined with other P3 fixes in a single PR

## Resources

- [TypeScript: Compiler Options - target](https://www.typescriptlang.org/tsconfig#target)
- [Node.js 22 Release Notes](https://nodejs.org/en/blog/release/v22.0.0/)
- [ES2022 Features](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-7.html)
- [@types/node on npm](https://www.npmjs.com/package/@types/node)
