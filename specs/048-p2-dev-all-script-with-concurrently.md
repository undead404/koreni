# P2: Add dev:all Script with Concurrently

**Priority**: P2 (Medium)  
**Effort**: 15 minutes  
**Impact**: Single-command dev environment  
**Status**: Pending

## Problem Statement

Currently, developers must run the frontend and backend in **two separate terminals**:

```bash
# Terminal 1
yarn dev

# Terminal 2
cd src/server && yarn dev
```

This is cumbersome and breaks the development flow. A single command should start both servers with unified, color-coded output.

### Current Behavior

```bash
$ yarn dev
# Starts Next.js on port 3000
# Developer must manually open another terminal for the server
```

## Solution Design

Add a `dev:all` script that uses `concurrently` to run both servers in parallel with prefixed output.

### Implementation

1. **Install concurrently**

   ```bash
   yarn add -D concurrently
   ```

2. **Add script to root `package.json`**

   ```json
   {
     "scripts": {
       "dev": "next dev --turbopack",
       "dev:server": "cd src/server && yarn dev",
       "dev:all": "concurrently --names 'frontend,server' --prefix '[{name}]' --colors 'yarn dev' 'yarn dev:server'"
     }
   }
   ```

3. **Usage**

   ```bash
   yarn dev:all
   ```

   Output:

   ```
   [frontend] ready - started server on 0.0.0.0:3000, url: http://localhost:3000
   [server] Server running on http://localhost:4000
   ```

## Scope

### Files to Modify

1. `package.json`
   - Add `concurrently` to `devDependencies`
   - Add `dev:all` script

### No Changes Required

- Any other files
- CI/CD workflows
- Build scripts

## Implementation Details

### Step 1: Install concurrently

```bash
yarn add -D concurrently
```

### Step 2: Update package.json

**Before**:

```json
{
  "devDependencies": {
    ...
  },
  "scripts": {
    "dev": "next dev --turbopack",
    "dev:server": "cd src/server && yarn dev",
    ...
  }
}
```

**After**:

```json
{
  "devDependencies": {
    "concurrently": "^8.2.0",
    ...
  },
  "scripts": {
    "dev": "next dev --turbopack",
    "dev:server": "cd src/server && yarn dev",
    "dev:all": "concurrently --names 'frontend,server' --prefix '[{name}]' --colors 'yarn dev' 'yarn dev:server'",
    ...
  }
}
```

### Step 3: Test Locally

```bash
yarn dev:all
```

Expected output:

```
[frontend] ready - started server on 0.0.0.0:3000, url: http://localhost:3000
[server] Server running on http://localhost:4000
```

## Configuration Options

### concurrently Flags

| Flag                    | Purpose                         |
| ----------------------- | ------------------------------- |
| `--names`               | Prefix names for each process   |
| `--prefix`              | Format for output prefix        |
| `--colors`              | Enable colored output           |
| `--kill-others`         | Kill all processes if one exits |
| `--kill-others-on-fail` | Kill all if one fails           |

### Recommended Configuration

```bash
concurrently \
  --names 'frontend,server' \
  --prefix '[{name}]' \
  --colors \
  --kill-others-on-fail \
  'yarn dev' \
  'yarn dev:server'
```

The `--kill-others-on-fail` flag ensures that if the frontend crashes, the server is also stopped (and vice versa), preventing orphaned processes.

## Test Plan

### TV-1: concurrently is installed

```bash
yarn list concurrently
```

Result: `concurrently@^8.2.0` listed

### TV-2: dev:all script exists

```bash
cat package.json | grep '"dev:all"'
```

Result: Script is present

### TV-3: dev:all starts both servers

```bash
timeout 10 yarn dev:all
```

Result: Both servers start, output is prefixed with `[frontend]` and `[server]`

### TV-4: Frontend is accessible

```bash
curl http://localhost:3000
```

Result: HTTP 200 (or redirect)

### TV-5: Server is accessible

```bash
curl http://localhost:4000/health
```

Result: HTTP 200 (or appropriate response)

### TV-6: Killing one server kills both

```bash
yarn dev:all
# Wait for both to start
# Kill frontend (Ctrl+C)
# Verify server also stops
```

Result: Both processes terminate

### TV-7: No breaking changes

- `yarn dev` still works (frontend only)
- `yarn dev:server` still works (server only)
- All other scripts unchanged

## Failure Modes

### FM-1: Port conflicts

**Risk**: Low (frontend uses 3000, server uses 4000)
**Mitigation**: Document port usage; allow env var overrides

### FM-2: Orphaned processes

**Risk**: Medium (if `--kill-others-on-fail` is not used)
**Mitigation**: Use `--kill-others-on-fail` flag

### FM-3: Output interleaving

**Risk**: Low (concurrently handles this well)
**Mitigation**: Use `--prefix` flag for clear separation

### FM-4: Windows compatibility

**Risk**: Low (concurrently supports Windows)
**Mitigation**: Test on Windows; use cross-platform commands

## Acceptance Criteria

- [x] `concurrently` added to `devDependencies`
- [x] `dev:all` script added to `package.json`
- [x] Script starts both frontend and server
- [x] Output is prefixed with `[frontend]` and `[server]`
- [x] Both servers are accessible
- [x] Killing one server kills both
- [x] No breaking changes to existing scripts
- [x] Works on macOS, Linux, and Windows

## Related Issues

- **P0-1**: Type-checking gate (completed)
- **P0-2**: Server tests on PR (completed)
- **P1**: Yarn dependency caching (independent)
- **P1**: Replace lodash with es-toolkit (independent)
- **P2**: Yarn 4 workspaces (will simplify dev setup further)

## Notes

- This is a low-risk, high-value improvement
- Improves developer experience significantly
- Can be implemented independently of other P2 issues
- Pairs well with Yarn 4 workspaces (will enable `yarn dev --recursive`)
- No impact on CI/CD or production builds

## Resources

- [concurrently npm package](https://www.npmjs.com/package/concurrently)
- [concurrently GitHub](https://github.com/open-cli-tools/concurrently)
- [npm-run-all2 alternative](https://www.npmjs.com/package/npm-run-all2)
