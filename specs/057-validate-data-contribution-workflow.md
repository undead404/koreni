# Validate Data Contribution Workflow

**Status**: Implemented  
**Priority**: P1 (prevents post-merge Typesense ingestion crashes)  
**Scope**: GitHub Actions workflow, validation script, logging improvements

## Problem Statement

Currently, the `enrich-data.yml` workflow only normalizes Russian orthography. It does not validate data consistency before merge. This causes the "Filename mismatch" error to detonate **post-merge** during Typesense ingestion (`src/populate-typesense/index.ts`), when the data is already on `main` and the search index is silently stale.

The error occurs when:

- YAML filename does not match the `id` field inside it (e.g., file is `1897-Foo.yaml` but `id: 1897-Bar`)
- `tableFilePath` in YAML does not match the actual CSV path
- CSV file is missing at the declared `tableFilePath`
- `id`, `tableFilePath`, or `title` collides with an existing record

## Solution

Shift validation left into the PR workflow. Add a new `Validate data consistency` step that runs **before** any mutation (before `modernize-russian`). This step reuses existing validation logic (`getTablesMetadata()`, `validateMetadata()`, `indexationTableSchema`) and exits with a descriptive error on the first invariant violation.

Additionally, improve logging in `modernize-russian` to provide context for non-error control flow and better error messages.

## Implementation

### New Files

#### `src/validate-data-contribution/index.ts`

Entry-point script. Orchestrates all validation checks and exits with a descriptive error on the first failure.

**Execution Steps** (in order):

1. **Identify contributed files** — Use `git diff --name-only origin/main...HEAD` to extract exactly-one YAML and exactly-one CSV.
   - Assert: `contributedYaml.length === 1` → else exit 1
   - Assert: `contributedCsv.length === 1` → else exit 1

2. **Parse and schema-validate the contributed YAML** — Read the YAML file and parse through `indexationTableSchema.parse()`.
   - On `ZodError`: exit 1 with field-level error details

3. **Filename ↔ `id` consistency** — Assert `bareFileName.toLowerCase() === ${id.toLowerCase()}.yaml`.
   - On failure: exit 1 with message naming both the filename and the `id` value

4. **`tableFilePath` ↔ contributed CSV consistency** — Assert `parsed.tableFilePath === contributedCsv[0]`.
   - On failure: exit 1 with message naming both paths

5. **CSV file existence on disk** — Use `fs.access()` to verify the file exists at the declared path.
   - On failure: exit 1

6. **Global uniqueness** — Call `getTablesMetadata()` which already enforces:
   - Filename ↔ `id` match for ALL existing records
   - `id`, `tableFilePath`, `title` uniqueness via `validateMetadata()`
   - On any error: exit 1

On full success: exit 0 with a confirmation message.

#### `src/validate-data-contribution/index.test.ts`

Vitest test suite covering:

- File extraction (exactly 1 YAML, exactly 1 CSV)
- Filename ↔ `id` consistency (case-insensitive)
- `tableFilePath` ↔ CSV path consistency (case-sensitive)
- YAML schema validation (Zod errors)
- CSV file existence
- Global uniqueness checks
- Integration tests with mocked I/O

### Modified Files

#### `.github/workflows/enrich-data.yml`

**Changes**:

- Workflow name: `Enrich Data` → `Validate Data Contribution`
- Job name: `update` → `validate-and-normalize`
- Step names:
  - `Modernize Russian` → `Normalize pre-reform Russian orthography`
  - `Commit and Push Changes` → `Commit normalized data`
- Commit message: `chore: auto-update data size [skip ci]` → `chore: normalize contributed data [skip ci]`
- **New step** (before modernization): `Validate data consistency` — runs `yarn data:validate`

**Step ordering**:

```
1. Checkout contribution
2. Set up tools via Mise
3. Install dependencies
4. Validate data consistency          ← NEW, before any mutation
5. Normalize pre-reform Russian orthography
6. Commit normalized data
```

#### `src/modernize-russian/index.ts`

**Logging improvements** (no logic changes):

| Scenario               | Current                                                     | Proposed                                                                                                                                                   |
| ---------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Non-Russian locale     | `console.error('Table is not in Russian'); process.exit(0)` | `console.log(\`Table '${table.id}' has locale '${table.tableLocale}', not 'ru'. Skipping orthography normalization.\`); process.exit(0)`                   |
| No YAML found          | `console.error('No YAML file changed')`                     | `console.error(\`Expected exactly 1 YAML file in data/records/, found 0. Changed files: ${changedFiles.join(', ')}\`)`                                     |
| Multiple YAMLs         | `console.error('More than one YAML file changed')`          | `console.error(\`Expected exactly 1 YAML file, found ${yamlFiles.length}: ${yamlFiles.join(', ')}. Each PR must contain exactly one data contribution.\`)` |
| No CSV found           | `console.error('No CSV file changed')`                      | `console.error(\`Expected exactly 1 CSV file in data/csv/, found 0. Changed files: ${changedFiles.join(', ')}\`)`                                          |
| Multiple CSVs          | `console.error('More than one CSV file changed')`           | `console.error(\`Expected exactly 1 CSV file, found ${csvFiles.length}: ${csvFiles.join(', ')}.\`)`                                                        |
| After successful write | _(nothing)_                                                 | `console.log(\`Normalized pre-reform Russian orthography in '${csvFile}'.\`)`                                                                              |

#### `package.json`

Add script:

```json
"data:validate": "tsx src/validate-data-contribution/index.ts"
```

## Failure Modes & Edge Cases

### FM-1: YAML `id` has different casing than filename

- **Trigger**: File is `1897-Marmuliivka.yaml` but `id: 1897-marmuliivka`
- **Detection**: Validation step 3 (case-insensitive comparison)
- **Current behavior**: Crashes post-merge in `getTablesMetadata()` at line 28
- **New behavior**: Fails at PR check with a message naming both values

### FM-2: `tableFilePath` does not match contributed CSV path

- **Trigger**: YAML declares `tableFilePath: data/csv/1897-Foo.csv` but CSV is at `data/csv/1897-foo.csv`
- **Detection**: Validation step 4 (exact string equality, case-sensitive)
- **Note**: Linux filesystems are case-sensitive; the comparison must be exact

### FM-3: CSV file committed at wrong path

- **Trigger**: CSV is at `data/csv/1897-Foo.csv` but YAML declares `tableFilePath: data/csv/1897-Bar.csv`
- **Detection**: Validation step 4 (string mismatch) and step 5 (file-not-found)

### FM-4: `id` or `title` collision with existing record

- **Trigger**: New contribution reuses an `id` that already exists
- **Detection**: Validation step 6 — `getTablesMetadata()` calls `validateMetadata()` which throws
- **Note**: `getTablesMetadata()` reads ALL YAML files including the newly contributed one (already checked out in PR branch)

### FM-5: Malformed YAML (Zod parse failure)

- **Trigger**: Missing required field, wrong type, or invalid enum value
- **Detection**: Validation step 2 — `indexationTableSchema.parse()` throws `ZodError`
- **Output**: ZodError's `.message` is surfaced verbatim, providing field-level detail

### FM-6: PR contains no data files

- **Trigger**: Workflow triggers on `paths: data/**` but changed file is `data/README.md`
- **Detection**: Validation step 1 — `contributedYaml.length === 0`
- **Behavior**: Exit 1 with message listing actual changed files
- **Note**: This is intentional — the workflow should only be triggered by genuine data contributions

### FM-7: Pre-existing filename mismatch in another record

- **Trigger**: A previously merged YAML has a filename↔id mismatch (possible before this fix)
- **Detection**: Validation step 6 — `getTablesMetadata()` iterates all YAMLs and throws on first mismatch
- **Behavior**: New contribution's PR fails due to pre-existing data integrity issue
- **Note**: This surfaces a latent bug. The fix is to correct the pre-existing mismatch.

### FM-8: Shallow clone (no `origin/main`)

- **Trigger**: `fetch-depth` is not 0
- **Detection**: `git diff --name-only origin/main...HEAD` returns empty or throws
- **Mitigation**: Workflow already sets `fetch-depth: 0`. Validation script guards with clear error message.

## Testing

See `src/validate-data-contribution/index.test.ts` for comprehensive Vitest suite covering:

- File extraction (cardinality checks)
- Filename ↔ `id` consistency (case-insensitive)
- `tableFilePath` ↔ CSV path consistency (case-sensitive)
- YAML schema validation
- CSV file existence
- Global uniqueness
- Integration tests with mocked I/O

## Impact

### Before

- Data PR is merged without validation
- Typesense ingestion crashes post-merge with "Filename mismatch"
- Search index is silently stale
- Debugging requires reading CI logs from a different workflow

### After

- Data PR fails at check step 4 with a descriptive error
- Reviewer sees a red ✗ on the PR checks panel
- Error message names the specific field(s) that need correction
- No post-merge surprises

### Backward Compatibility

- No breaking changes to existing APIs or data structures
- Validation script is purely additive (new file, new script)
- Logging improvements in `modernize-russian` are backward-compatible (same exit codes, better messages)
- Workflow step reordering is transparent to users (same end result, better error detection)

## Verification

Run the test suite:

```bash
yarn test src/validate-data-contribution/index.test.ts
```

Verify TypeScript compilation:

```bash
yarn exec tsc --noEmit
```

Verify the workflow syntax (GitHub Actions linter):

```bash
# Manual check: push a test PR and observe the workflow runs
```

## Future Enhancements

- Add a `--fix` mode to the validation script that auto-corrects common issues (e.g., rename YAML to match `id`)
- Integrate validation into the contribution form's frontend (client-side preview before submission)
- Add a `yarn data:validate-all` command to audit all existing records for consistency
