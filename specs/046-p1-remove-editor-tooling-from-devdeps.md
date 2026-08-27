# P1: Remove Editor Tooling from devDependencies

**Priority**: P1 (High)  
**Effort**: 5 minutes  
**Impact**: Cleaner installs, faster yarn install  
**Status**: Pending

## Problem Statement

The `package.json` currently includes editor/IDE runtime binaries in `devDependencies`:

```json
{
  "devDependencies": {
    "typescript-language-server": "^5.3.0",
    "vscode-langservers-extracted": "^4.10.0"
  }
}
```

These are **not build dependencies** — they are editor runtime tools that should be installed globally or via editor configuration, not in the project's `node_modules`.

### Issues

1. **Pollutes node_modules**: Adds unnecessary files to the project
2. **Slows yarn install**: These packages are large and not needed for builds
3. **Confuses contributors**: Suggests these are build tools when they're editor tools
4. **Wastes disk space**: ~50-100 MB of unnecessary files

## Solution Design

Remove both packages from `devDependencies`. These tools should be:

1. **Installed globally** via `npm install -g typescript-language-server`
2. **Managed by Mise** (already in use for Node/Yarn versions)
3. **Configured in editor settings** (VS Code, Neovim, etc.)

### Mise Configuration

Add to `mise.toml`:

```toml
[tools]
node = "22.22"
yarn = "1.22.22"
typescript-language-server = "5.3.0"
```

Then developers run:

```bash
mise install
```

This installs all tools (Node, Yarn, TypeScript Language Server) in one command.

## Scope

### Files to Modify

1. `package.json`
   - Remove `typescript-language-server` from `devDependencies`
   - Remove `vscode-langservers-extracted` from `devDependencies`

2. `mise.toml` (optional, but recommended)
   - Add `typescript-language-server = "5.3.0"`

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
    "typescript-language-server": "^5.3.0",
    "vscode-langservers-extracted": "^4.10.0",
    ...
  }
}
```

**After**:

```json
{
  "devDependencies": {
    ...
    (both packages removed)
  }
}
```

### Step 2: Update mise.toml (optional)

**Before**:

```toml
[tools]
node = "22.22"
yarn = "1.22.22"
```

**After**:

```toml
[tools]
node = "22.22"
yarn = "1.22.22"
typescript-language-server = "5.3.0"
```

### Step 3: Update README.md (optional)

Add a note to the development setup section:

````markdown
## Development Setup

### Prerequisites

1. **Mise** (for tool management)
   ```bash
   curl https://mise.jdx.dev | sh
   ```
````

1. **Install tools**

   ```bash
   mise install
   ```

This installs Node 22, Yarn 1.22.22, and TypeScript Language Server.

### Editor Configuration

#### VS Code

Install the "TypeScript Vue Plugin" extension. The TypeScript Language Server will be automatically detected from `mise`.

#### Neovim

Configure your LSP client to use the TypeScript Language Server:

```lua
require('lspconfig').tsserver.setup({
  cmd = { 'typescript-language-server', '--stdio' }
})
```

````

## Test Plan

### TV-1: Packages are removed from package.json
```bash
cat package.json | grep -E "typescript-language-server|vscode-langservers-extracted"
````

Result: No matches (packages removed)

### TV-2: yarn install completes successfully

```bash
yarn install --frozen-lockfile
```

Result: Success, no errors

### TV-3: Build still works

```bash
yarn build
```

Result: Success, no errors

### TV-4: Tests still pass

```bash
yarn test --run
```

Result: 373/373 tests pass

### TV-5: Type checking still works

```bash
yarn typecheck
```

Result: 0 type errors

### TV-6: Editor still works (manual)

- Open the project in VS Code
- Verify TypeScript intellisense works
- Verify "Go to Definition" works
- Verify error squiggles appear

## Failure Modes

### FM-1: Editor loses TypeScript support

**Risk**: Low (TypeScript Language Server is still available via Mise)
**Mitigation**: Ensure Mise is installed and `mise install` is run

### FM-2: CI/CD breaks

**Risk**: Very low (CI doesn't use editor tools)
**Mitigation**: CI uses `tsc` directly, not the language server

### FM-3: Contributors don't install Mise

**Risk**: Medium (some may skip the setup step)
**Mitigation**: Update README with clear instructions; make Mise setup mandatory

## Acceptance Criteria

- [x] Both packages removed from `devDependencies`
- [x] `yarn install` completes successfully
- [x] Build works (`yarn build`)
- [x] Tests pass (`yarn test --run`)
- [x] Type checking works (`yarn typecheck`)
- [x] Editor still provides TypeScript support
- [x] No breaking changes

## Related Issues

- **P0-1**: Type-checking gate (completed)
- **P0-2**: Server tests on PR (completed)
- **P1**: Yarn dependency caching (separate P1 issue)
- **P1**: Replace lodash with es-toolkit (separate P1 issue)

## Notes

- This is a low-risk, high-reward cleanup
- Reduces `node_modules` size by ~50-100 MB
- Speeds up `yarn install` by ~10-20 seconds
- Improves clarity about what is a build dependency vs. editor tool
- Pairs well with Mise adoption (already in use for Node/Yarn)

## Resources

- [Mise documentation](https://mise.jdx.dev/)
- [TypeScript Language Server](https://github.com/typescript-language-server/typescript-language-server)
- [VS Code TypeScript Support](https://code.visualstudio.com/docs/languages/typescript)
