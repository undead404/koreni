# P2: Migrate to Yarn 4 Workspaces

**Priority**: P2 (Medium)  
**Effort**: 2-4 hours  
**Impact**: Unified installs, deduped deps, simplified CI  
**Status**: ✅ Implemented

## Problem Statement

The project has a monorepo structure with multiple `package.json` files:

```
koreni/
├── package.json                    (root, frontend)
├── src/server/package.json         (backend)
└── src/daily-report/package.json   (daily report script)
```

However, **Yarn 1 doesn't support modern workspaces**, so each sub-project is treated as an independent repository:

### Current Issues

1. **Duplicate dependencies**: `zod`, `yaml`, `dotenv`, `vitest`, `tsx`, `typescript` are installed **three times** (root, server, daily-report)
2. **Manual CI steps**: CI requires separate `yarn install` for each directory
3. **No shared internal packages**: `src/shared/` cannot be imported as a package by both frontend and server
4. **Version drift risk**: Each `package.json` can have different versions of shared deps
5. **Slow installs**: Multiple lock files, multiple install steps

### Current CI Workflow

```yaml
- name: Install dependencies
  run: yarn --frozen-lockfile --prefer-offline

- name: Install server dependencies
  run: yarn --frozen-lockfile --prefer-offline
  working-directory: src/server

- name: Install daily-report dependencies
  run: yarn --frozen-lockfile --prefer-offline
  working-directory: src/daily-report
```

## Solution Design

Migrate to **Yarn 4 with workspaces** to:

1. **Deduplicate dependencies**: Shared deps installed once at root
2. **Unified lock file**: Single `yarn.lock` for entire monorepo
3. **Single install step**: `yarn install` installs all workspaces
4. **Internal packages**: `src/shared/` becomes a proper workspace package
5. **Simplified CI**: One `yarn install`, one `yarn test`, one `yarn build`

### Workspace Structure

```
koreni/
├── package.json                    (root workspace)
├── yarn.lock                       (unified)
├── src/
│   ├── app/                        (frontend, implicit workspace)
│   ├── server/
│   │   └── package.json            (workspace member)
│   ├── shared/
│   │   └── package.json            (workspace member, NEW)
│   └── daily-report/
│       └── package.json            (workspace member)
└── .yarnrc.yml                     (Yarn 4 config)
```

### Root package.json

```json
{
  "name": "koreni-monorepo",
  "private": true,
  "workspaces": ["src/server", "src/shared", "src/daily-report"]
}
```

### src/shared/package.json (NEW)

```json
{
  "name": "@koreni/shared",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    ".": "./index.ts"
  },
  "files": ["*.ts"],
  "dependencies": {
    "zod": "~4.3.6",
    "yaml": "~2.8.3"
  }
}
```

## Scope

### Phase 1: Setup Yarn 4

1. **Upgrade Yarn**

   ```bash
   yarn set version 4.0.0
   ```

2. **Create `.yarnrc.yml`**

   ```yaml
   nodeLinker: node-modules
   enableScripts: true
   ```

3. **Update `mise.toml`**
   ```toml
   [tools]
   node = "22.22"
   yarn = "4.0.0"
   ```

### Phase 2: Configure Workspaces

1. **Update root `package.json`**
   - Add `"workspaces"` field
   - Move shared deps to root
   - Remove workspace-specific deps

2. **Create `src/shared/package.json`**
   - Define as `@koreni/shared` package
   - Export shared utilities
   - Declare dependencies

3. **Update `src/server/package.json`**
   - Remove duplicate deps (zod, yaml, dotenv, vitest, tsx, typescript)
   - Add `@koreni/shared` as dependency
   - Keep server-specific deps

4. **Update `src/daily-report/package.json`**
   - Remove duplicate deps
   - Add `@koreni/shared` as dependency
   - Keep script-specific deps

### Phase 3: Update Imports

1. **Frontend imports from shared**

   ```typescript
   // Before
   import { getTableData } from '../shared/get-table-data';

   // After
   import { getTableData } from '@koreni/shared';
   ```

2. **Server imports from shared**
   ```typescript
   // Before
   import { validateMetadata } from '../../shared/validate-metadata.js';

   // After
   import { validateMetadata } from '@koreni/shared';
   ```

### Phase 4: Update CI/CD

1. **Single install step**

   ```yaml
   - name: Install dependencies
     run: yarn install --frozen-lockfile
   ```

2. **Unified test command**

   ```yaml
   - name: Run all tests
     run: yarn test --recursive
   ```

3. **Unified build command**
   ```yaml
   - name: Build all workspaces
     run: yarn build --recursive
   ```

## Files to Modify

### New Files

- `src/shared/package.json` (new workspace member)
- `.yarnrc.yml` (Yarn 4 config)

### Modified Files

- `package.json` (add workspaces, deduplicate deps)
- `src/server/package.json` (remove duplicate deps, add @koreni/shared)
- `src/daily-report/package.json` (remove duplicate deps, add @koreni/shared)
- `mise.toml` (upgrade Yarn to 4.0.0)
- `.github/workflows/check-pr.yml` (simplify install steps)
- `.github/workflows/main.yml` (simplify install steps)
- `tsconfig.json` (add path alias for @koreni/shared)
- `src/server/tsconfig.json` (add path alias for @koreni/shared)

### Import Updates

- All files importing from `src/shared/` → import from `@koreni/shared`
- Estimated: ~50-100 import statements

## Test Plan

### TV-1: Yarn 4 is installed

```bash
yarn --version
```

Result: `4.0.0` or later

### TV-2: Single yarn.lock file

```bash
ls -la yarn.lock
```

Result: Single `yarn.lock` at root

### TV-3: Workspaces are recognized

```bash
yarn workspaces list
```

Result: Lists all 3 workspaces

### TV-4: Single install step works

```bash
yarn install --frozen-lockfile
```

Result: All workspaces installed, no errors

### TV-5: Dependencies are deduplicated

```bash
ls -la node_modules/zod
```

Result: Single `zod` at root, not in each workspace

### TV-6: All tests pass

```bash
yarn test --recursive
```

Result: 373 frontend + 61 server + any daily-report tests pass

### TV-7: Type checking passes

```bash
yarn typecheck
```

Result: 0 type errors

### TV-8: Builds work

```bash
yarn build --recursive
```

Result: All workspaces build successfully

### TV-9: Imports from @koreni/shared work

- Frontend can import from `@koreni/shared`
- Server can import from `@koreni/shared`
- No path resolution errors

### TV-10: CI/CD still works

- PR checks pass
- Main pipeline passes
- Deployments work

## Failure Modes

### FM-1: Yarn 4 has breaking changes

**Risk**: Medium (major version upgrade)
**Mitigation**: Test thoroughly in a branch; refer to Yarn 4 migration guide

### FM-2: ESM strict mode conflicts with workspaces

**Risk**: Low (Yarn 4 supports ESM well)
**Mitigation**: Use `nodeLinker: node-modules` to avoid PnP issues

### FM-3: Path aliases don't resolve correctly

**Risk**: Low (tsconfig paths are well-supported)
**Mitigation**: Test imports in both frontend and server

### FM-4: CI/CD breaks during migration

**Risk**: Medium (multiple moving parts)
**Mitigation**: Test in a branch first; update CI gradually

### FM-5: Contributors have stale Yarn cache

**Risk**: Low (Yarn 4 uses different cache format)
**Mitigation**: Document cache clearing: `yarn cache clean`

## Acceptance Criteria

- [x] Yarn upgraded to 4.0.0
- [x] `.yarnrc.yml` created with correct config
- [x] Workspaces declared in root `package.json`
- [x] `src/shared/package.json` created as workspace member
- [x] Duplicate dependencies removed from sub-projects
- [x] All imports updated to use `@koreni/shared`
- [x] Single `yarn.lock` file at root
- [x] Single `yarn install` installs all workspaces
- [x] All tests pass (373 frontend + 61 server)
- [x] Type checking passes
- [x] All builds work
- [x] CI/CD passes
- [x] No breaking changes to public APIs

## Related Issues

- **P0-1**: Type-checking gate (completed)
- **P0-2**: Server tests on PR (completed)
- **P1**: Yarn dependency caching (will be simpler with single lock file)
- **P1**: Replace lodash with es-toolkit (independent)
- **P1**: Remove editor tooling from devDeps (independent)

## Migration Path

1. **Week 1**: Upgrade Yarn, create workspaces config, test locally
2. **Week 2**: Create `src/shared/package.json`, deduplicate deps
3. **Week 3**: Update all imports to use `@koreni/shared`
4. **Week 4**: Update CI/CD, test in staging, deploy

## Notes

- This is a significant refactoring but well-understood
- Yarn 4 is stable and widely used
- Workspaces are a standard monorepo pattern
- Can be done incrementally (one workspace at a time)
- Provides long-term maintainability benefits
- Enables future micro-package extraction

## Resources

- [Yarn 4 Migration Guide](https://yarnpkg.com/migration/guide)
- [Yarn Workspaces Documentation](https://yarnpkg.com/features/workspaces)
- [Yarn 4 Release Notes](https://github.com/yarnpkg/yarn/releases/tag/v4.0.0)
- [ESM in Node.js](https://nodejs.org/en/docs/guides/ecmascript-modules/)
