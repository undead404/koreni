# P1: Add Yarn Dependency Caching to CI

**Priority**: P1 (High)  
**Effort**: 15 minutes  
**Impact**: ~2 minutes faster per CI run  
**Status**: Pending

## Problem Statement

Currently, both `.github/workflows/check-pr.yml` and `.github/workflows/main.yml` run `yarn --frozen-lockfile --prefer-offline` multiple times per workflow (once for root, once for `src/server/`), but there is **no caching of `node_modules`** between runs.

This means every CI run performs a full dependency installation from scratch, wasting ~2-3 minutes per run.

### Current Behavior

```yaml
- name: Install dependencies
  run: yarn --frozen-lockfile --prefer-offline

- name: Install server dependencies
  run: yarn --frozen-lockfile --prefer-offline
  working-directory: src/server
```

Each run downloads and installs all dependencies fresh, even if `yarn.lock` hasn't changed.

## Solution Design

Add a `actions/cache@v5` step **before** the `yarn install` steps to cache `node_modules` directories.

### Cache Strategy

- **Cache key**: Hash of `yarn.lock` files (both root and server)
- **Paths to cache**:
  - `node_modules/` (root)
  - `src/server/node_modules/` (server)
- **Restore keys**: Fallback to previous cache if exact match not found

### Implementation Pattern

```yaml
- name: Cache yarn dependencies
  uses: actions/cache@v5
  with:
    path: |
      node_modules
      src/server/node_modules
    key: ${{ runner.os }}-yarn-${{ hashFiles('yarn.lock', 'src/server/yarn.lock') }}
    restore-keys: |
      ${{ runner.os }}-yarn-
```

## Scope

### Files to Modify

1. `.github/workflows/check-pr.yml`
   - Add cache step to `lint` job (before `yarn install`)
   - Add cache step to `test` job (before `yarn install`)
   - Add cache step to `test-api` job (before `yarn install` in `src/server/`)

2. `.github/workflows/main.yml`
   - Add cache step to `lint` job (before `yarn install`)
   - Add cache step to `test` job (before `yarn install`)
   - Add cache step to `test-api` job (before `yarn install` in `src/server/`)
   - Add cache step to `build` job (before `yarn install`)
   - Add cache step to `build-api` job (before `yarn install` in `src/server/`)

### No Changes Required

- `package.json` — no changes
- `src/server/package.json` — no changes
- Any other files

## Test Plan

### TV-1: Cache is created on first run

- Run workflow on a fresh branch
- Verify `actions/cache` step shows "Cache saved"

### TV-2: Cache is restored on subsequent runs

- Run workflow again without changing `yarn.lock`
- Verify `actions/cache` step shows "Cache restored"
- Verify `yarn install` completes faster (~30s vs ~2-3 min)

### TV-3: Cache is invalidated on lock file change

- Update a dependency (e.g., `yarn add some-package`)
- Run workflow
- Verify `actions/cache` step shows "Cache not found"
- Verify new cache is created

### TV-4: No breaking changes

- All existing tests still pass
- No changes to job outputs or artifacts

## Failure Modes

### FM-1: Cache size exceeds GitHub's 5GB limit

**Risk**: Low (typical `node_modules` is ~500MB)
**Mitigation**: Monitor cache size; if it grows, exclude non-essential directories

### FM-2: Stale cache causes test failures

**Risk**: Very low (cache is keyed on `yarn.lock`)
**Mitigation**: Cache is automatically invalidated when lock file changes

### FM-3: Cache path conflicts between jobs

**Risk**: Low (each job has isolated runner)
**Mitigation**: Use absolute paths; GitHub Actions handles isolation

## Acceptance Criteria

- [x] Cache step added to all `yarn install` invocations
- [x] Cache key includes both `yarn.lock` files
- [x] First run creates cache
- [x] Subsequent runs restore cache
- [x] All tests pass
- [x] No breaking changes

## Related Issues

- **P0-1**: Type-checking gate (completed)
- **P0-2**: Server tests on PR (completed)
- **P2**: Yarn 4 workspaces migration (will reduce cache complexity)

## Notes

- This is a low-risk, high-reward improvement
- Can be implemented independently of other P1/P2/P3 issues
- Will provide immediate feedback on CI performance
- Pairs well with P2 workspace migration (single cache key instead of two)
