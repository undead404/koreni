# P3: Fix check-pr.yml Path Filter

**Priority**: P3 (Low)  
**Effort**: 5 minutes  
**Impact**: Avoid unnecessary CI runs  
**Status**: Completed

## Problem Statement

The `.github/workflows/check-pr.yml` has a path filter that is **ineffective**:

```yaml
on:
  pull_request:
    paths:
      - './**'
      - 'src/**'
```

The glob pattern `'./**'` matches **all files**, making the path filter meaningless. This causes the workflow to run on **every PR**, even if only documentation or data files changed.

### Current Behavior

```
PR changes: README.md, data/records/file.yaml
Expected: Workflow should NOT run (no code changes)
Actual: Workflow RUNS (because './**' matches everything)
```

## Solution Design

Replace the ineffective path filter with a **specific list of code-related paths**:

```yaml
on:
  pull_request:
    paths:
      - '.github/workflows/check-pr.yml'
      - '.eslintrc.mjs'
      - '.prettierrc.json'
      - '.stylelintrc.json'
      - 'eslint.config.mjs'
      - 'next.config.ts'
      - 'package.json'
      - 'tsconfig.json'
      - 'vitest.config.mts'
      - 'vitest.setup.ts'
      - 'src/app/**'
      - 'src/server/**'
      - 'src/shared/**'
      - 'src/types/**'
      - 'src/populate-typesense/**'
      - 'src/dockerize-typesense/**'
```

### Rationale

- **Include**: All code, config, and test files
- **Exclude**: Data files (`data/**`), documentation (`*.md`), generated files (`.next/`, `dist/`)

## Scope

### Files to Modify

1. `.github/workflows/check-pr.yml`
   - Replace `paths` filter with specific paths

### No Changes Required

- Any other files
- CI/CD logic
- Build scripts

## Implementation

### Step 1: Update check-pr.yml

**Before**:

```yaml
on:
  pull_request:
    paths:
      - './**'
      - 'src/**'
    types: [opened, synchronize, reopened]
```

**After**:

```yaml
on:
  pull_request:
    paths:
      - '.github/workflows/check-pr.yml'
      - '.prettierrc.json'
      - '.stylelintrc.json'
      - 'eslint.config.mjs'
      - 'next.config.ts'
      - 'package.json'
      - 'src/server/package.json'
      - 'src/server/tsconfig.json'
      - 'src/server/vitest.config.mts'
      - 'tsconfig.json'
      - 'vitest.config.mts'
      - 'vitest.setup.ts'
      - 'src/app/**'
      - 'src/server/**'
      - 'src/shared/**'
      - 'src/types/**'
      - 'src/populate-typesense/**'
      - 'src/dockerize-typesense/**'
    types: [opened, synchronize, reopened]
```

## Test Plan

### TV-1: Path filter is no longer a no-op

```bash
# Verify the filter is specific
grep -A 20 "pull_request:" .github/workflows/check-pr.yml | grep "paths:" -A 15
```

Result: Specific paths listed, no `'./**'`

### TV-2: Workflow runs on code changes

- Create PR with changes to `src/app/page.tsx`
- Expected: Workflow runs

### TV-3: Workflow skips on data-only changes

- Create PR with changes to `data/records/file.yaml`
- Expected: Workflow skips (no code changes)

### TV-4: Workflow skips on documentation changes

- Create PR with changes to `README.md`
- Expected: Workflow skips (no code changes)

### TV-5: Workflow runs on config changes

- Create PR with changes to `package.json`
- Expected: Workflow runs (config affects build)

### TV-6: Workflow runs on workflow changes

- Create PR with changes to `.github/workflows/check-pr.yml`
- Expected: Workflow runs (meta-change)

## Failure Modes

### FM-1: Path filter is too restrictive

**Risk**: Low (we're being explicit)
**Mitigation**: If a file type is missed, add it to the filter

### FM-2: New directories are not covered

**Risk**: Medium (if new code directories are added)
**Mitigation**: Update the filter when new directories are created

### FM-3: Developers bypass the filter

**Risk**: Low (GitHub enforces path filters)
**Mitigation**: Document the filter in CONTRIBUTING.md

## Acceptance Criteria

- [x] Path filter is specific (no `'./**'`)
- [x] Workflow runs on code changes
- [x] Workflow skips on data-only changes
- [x] Workflow skips on documentation changes
- [x] Workflow runs on config changes
- [x] Workflow runs on workflow changes
- [x] No breaking changes

## Related Issues

- **P0-1**: Type-checking gate (completed)
- **P0-2**: Server tests on PR (completed)
- **P1**: Yarn dependency caching (independent)
- **P1**: Replace lodash with es-toolkit (independent)
- **P2**: Yarn 4 workspaces (independent)

## Notes

- This is a low-risk, low-effort improvement
- Reduces unnecessary CI runs
- Saves GitHub Actions minutes
- Improves feedback loop for data-only PRs
- Should be done after P0/P1/P2 to avoid churn

## Resources

- [GitHub Actions: Workflow syntax - paths](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#onpushpullrequestpaths)
- [GitHub Actions: Filtering for pull requests](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#onpullrequestpaths)
