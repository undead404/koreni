---
description: Replace actions/setup-node with jdx/mise-action in GitHub Actions workflows to load Node and Yarn versions from mise.toml and clean up removed .nvmrc references.
targets:
  - .github/workflows/check-pr.yml
  - .github/workflows/main.yml
  - .github/workflows/typesense.yml
  - .github/workflows/enrich-data.yml
  - .github/workflows/daily-report.yml
context:
  - mise.toml
---

# Fix GitHub Actions Workflows After NVM to Mise Migration

## 1. Context & Scope

- **Problem:**
  The project has transitioned from NVM to Mise for managing tool versions.
  The root `.nvmrc` file is being removed.
  The active workflows (`check-pr.yml`, `main.yml`, `typesense.yml`, `enrich-data.yml`, `daily-report.yml`) still reference `.nvmrc` (and/or `src/server/.nvmrc`), causing workflow setups or executions to fail due to missing or mismatched configuration files.
- **Goal:**
  Standardize tool versioning across the entire repository by utilizing Mise in GitHub Actions workflows. Remove all references to `.nvmrc` and substitute `actions/setup-node` with `jdx/mise-action`.

## 2. Refactoring Directives

### A. Core Workflow Changes (All Workflow Files)

For each target GitHub Actions workflow, replace the traditional Node.js setup step with Mise.

#### 1. `.github/workflows/check-pr.yml`

- **Lint Job & Test Job Node.js Setup:**
  - **Before:**
    ```yaml
    - name: Set up Node.js
      uses: actions/setup-node@v6
      with:
        cache: 'yarn'
        node-version-file: .nvmrc
    ```
  - **After:**
    ```yaml
    - name: Set up tools via Mise
      uses: jdx/mise-action@v4
    ```

#### 2. `.github/workflows/main.yml`

- **Lint Job, Test Job, Build Job, and Build-API Job Setup:**
  - **Before:**
    ```yaml
    - name: Set up Node.js
      uses: actions/setup-node@v6
      with:
        cache: 'yarn'
        node-version-file: .nvmrc
    ```
  - **After:**
    ```yaml
    - name: Set up tools via Mise
      uses: jdx/mise-action@v4
    ```

- **Test-API Job Setup:**
  - **Before:**
    ```yaml
    - name: Set up Node.js
      uses: actions/setup-node@v6
      with:
        cache: 'yarn'
        cache-dependency-path: src/server/yarn.lock
        node-version-file: src/server/.nvmrc
    ```
  - **After:**
    ```yaml
    - name: Set up tools via Mise
      uses: jdx/mise-action@v4
    ```

#### 3. `.github/workflows/typesense.yml`

- **Populate-Typesense Job Setup:**
  - **Before:**
    ```yaml
    - name: Set up Node.js
      uses: actions/setup-node@v6
      with:
        cache: 'yarn'
        node-version-file: .nvmrc
    ```
  - **After:**
    ```yaml
    - name: Set up tools via Mise
      uses: jdx/mise-action@v4
    ```

#### 4. `.github/workflows/enrich-data.yml`

- **Update Job Setup:**
  - **Before:**
    ```yaml
    - name: Set up Node.js
      uses: actions/setup-node@v6
      with:
        cache: 'yarn'
        node-version-file: .nvmrc
    ```
  - **After:**
    ```yaml
    - name: Set up tools via Mise
      uses: jdx/mise-action@v4
    ```

#### 5. `.github/workflows/daily-report.yml`

- **Notify Job Setup:**
  - **Before:**
    ```yaml
    - name: Setup Node.js
      if: steps.find-files.outputs.has_files == 'true'
      uses: actions/setup-node@v6
      with:
        cache: 'yarn'
        cache-dependency-path: src/daily-report/yarn.lock
        node-version-file: src/daily-report/.nvmrc
    ```
  - **After:**
    ```yaml
    - name: Set up tools via Mise
      if: steps.find-files.outputs.has_files == 'true'
      uses: jdx/mise-action@v4
    ```

### B. Directory Cleanup

- Ensure `.nvmrc` files at the root (`.nvmrc`), under the Hono server directory (`src/server/.nvmrc`), and under daily-report (`src/daily-report/.nvmrc`) are completely removed, as all Node.js and Yarn versioning is now centralized in `/mise.toml`.

## 3. Testing & Verification Directives

- Verify that all modified workflow YAML files conform to correct GitHub Actions schema and syntax.
- Ensure that `jdx/mise-action@v4` successfully installs Node `22.22` and Yarn `1.22.22` as specified in `/mise.toml` when run on GitHub Actions runner.
- Ensure dependency resolution (`yarn install`), linting, build, and test run tasks finish successfully under the new GHA setup.
