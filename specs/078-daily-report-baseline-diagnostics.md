---
description: Log the exact prior-run baseline and checkout used by the daily Telegram records report without changing report selection or delivery.
status: implementation-ready
targets:
  - .github/workflows/daily-report.yml
context:
  - latest-report.log
  - specs/043-fix-gha-workflows-mise.md
---

# Daily Report Baseline Diagnostics

<Architecture>

## Goal and boundaries

Add enough non-secret diagnostics to `.github/workflows/daily-report.yml` to identify which successful workflow run and commit SHA the report diff actually used. The October 8, 2026 run checked out `c2216b66` and listed records already present in the expected preceding-success commit `54adcfb`; its log did not print the actual `START_COMMIT`. Instrumentation is the complete scope because the available evidence does not establish why the actual baseline differed.

This is a Zone A workflow-only change. Under the repository's path partition, every target not under `src/server/` is Zone A. There are no Zone B targets. Do not modify `src/daily-report/src/index.ts`, record files, source schemas, or server code.

## Exact target and operations

- `.github/workflows/daily-report.yml`:
  - In the existing `Find new records since the last successful report` step, obtain the prior-success run metadata and selected `head_sha` from the same existing GitHub Actions API request and the same filters: workflow `daily-report.yml`, branch `main`, status `success`, `per_page=1`.
  - Preserve the current `START_COMMIT` selection and fallback behavior. Record whether the selected value came from the API or from the existing root-commit fallback.
  - Log the checkout `HEAD` SHA, prior run ID and available metadata (`head_branch`, `status`, `conclusion`, `created_at`, `head_sha`), resolved `START_COMMIT`, source (`api` or `root-fallback`), and candidate count.
  - Retain the existing `added_files.txt` listing. Do not add a second API request solely for logging; derive diagnostics from the same response used to select the baseline.

Use explicit, stable labels and `printf` or equivalent structured plain-text output. Never print `GH_TOKEN`, any secret, request headers, or the complete environment. The current Bash `-e` behavior remains intact.

## Zone map

| Zone                    | Exact paths                          | Operations                                                                  |
| ----------------------- | ------------------------------------ | --------------------------------------------------------------------------- |
| A                       | `.github/workflows/daily-report.yml` | Add baseline and checkout diagnostics only.                                 |
| A, explicitly unchanged | `src/daily-report/src/index.ts`      | Continue consuming `added_files.txt` and sending the same Telegram message. |
| B                       | None                                 | No Hono or server work.                                                     |

</Architecture>

<DataFlow>

1. The existing checkout selects the event's repository state. Immediately before the diff, read and log `git rev-parse HEAD` as `CHECKOUT_HEAD_SHA`; do not change checkout `ref`, `fetch-depth`, triggers, or permissions.
2. Make the existing single read-only Actions API request with its existing repository, workflow, `branch=main`, `status=success`, and `per_page=1` parameters. From its first result, retain the fields needed for diagnostics and derive `START_COMMIT` from the same `head_sha` that the workflow would currently select. Do not select a different run or change ordering/filter semantics.
3. If the selected `head_sha` is non-empty, set the diagnostic source label to `api`; log the previous run ID, branch, status, conclusion, creation time, SHA, and resolved `START_COMMIT`.
4. If the selected `head_sha` is empty, preserve the existing root-commit fallback exactly. Log empty/no prior-run metadata, the selected root SHA, and source label `root-fallback`. This phase does not alter first-run behavior.
5. Run the existing `git diff --name-only --diff-filter=A "$START_COMMIT" HEAD` pipeline and the existing path filter unchanged. Log the candidate count and retain the current candidate path listing.
6. Preserve the current `has_files` transition and downstream behavior: no candidates skips setup/install/send; candidates continue through the existing report script, which sends the same Telegram payload. Do not introduce a report cursor, sent-file registry, retry, deduplication, or new output contract.

The diagnostics are observability only. They must not mutate GitHub state, repository files, record data, or Telegram state.

</DataFlow>

<FailureModes>

- **Actions API request fails:** Preserve current Bash `-e` handling. A nonzero API command must continue to fail the step; do not mask it, reinterpret it as an empty result, or fall back to the root commit.
- **API succeeds but returns no matching run or no `head_sha`:** Preserve the existing root fallback and log that it was selected. The fallback may list a large historical set; this spec intentionally does not change that behavior.
- **API returns a stale but non-empty SHA:** Log the exact run metadata and resolved SHA so the mismatch is diagnosable. Continue the existing diff and report behavior; do not silently substitute another run or discard candidates.
- **API response fields are absent or null:** Log absent metadata as empty/`null` without failing solely because an optional diagnostic field is missing. Preserve the current fallback decision based on whether `head_sha` is empty.
- **Non-empty invalid SHA or diff failure:** Do not change the existing pipeline's error behavior in this diagnostics-only change. The existing `|| true` remains untouched; the logged baseline and zero candidate count should make this condition visible for later planning.
- **Concurrent runs:** Preserve the current selection semantics. Do not add concurrency groups, locks, or retries as part of this specification.
- **Secret exposure:** Log only the allowlisted run metadata and commit SHAs. Never log `GH_TOKEN`, credentials, request headers, or full API/environment payloads.
- **Types and schemas:** No TypeScript types, YAML record schemas, or API contracts change. Do not weaken or add types in `src/daily-report/src/index.ts`; it is not a target.
- **Report contents and delivery:** Do not change record schema/types, Telegram formatting, success criteria, retry boundaries, or the behavior after Telegram accepts or rejects a message.

</FailureModes>

<TestPlan>

## Exact test files and mock boundaries

- Test files added or modified: **none**. The target is a GitHub Actions YAML workflow; the repository has no daily-report test file or workflow-unit-test harness. Do not introduce a test framework or source test solely for these log statements.
- Mock boundaries: **none**. Do not send a Telegram message or make a test-time live GitHub API request. The actual scheduled workflow's existing API request is observed as part of normal operation, not added as a test call.

## Exact assertions and verification

1. Validate `.github/workflows/daily-report.yml` with the repository's available GitHub Actions YAML/workflow linter. Assert the workflow remains valid and the existing triggers, permissions, checkout, filters, and conditional steps are unchanged apart from diagnostic statements.
2. Inspect the next normal Actions run log. Assert it prints:
   - `CHECKOUT_HEAD_SHA`, matching that run's checked-out `HEAD`;
   - previous successful run ID and its `head_sha` when present;
   - `START_COMMIT`, exactly matching the SHA used as the first `git diff` argument;
   - `START_COMMIT_SOURCE=api` for a non-empty API SHA or `START_COMMIT_SOURCE=root-fallback` for the existing empty-result fallback;
   - candidate count matching the number of paths printed under `added_files.txt`.
3. Assert no token, secret, header, or complete environment/API response appears in the new diagnostic lines.
4. For the historical comparison already examined, assert `git diff --name-only --diff-filter=A 54adcfb896662420fb39c673b8923c3a21f94e79 c2216b66dc576b22d61f9a59ed57168990fd63e4` does not list `data/records/TsDIAK-127-1078-291-1900.yaml`. This is a diagnostic cross-check only; it is not a replacement for the actual logged `START_COMMIT`.
5. Compare candidate selection before/after the change using identical API response and checkout inputs. Assert the candidate path list, `has_files` value, and whether downstream steps run are unchanged.

</TestPlan>

## Acceptance criteria

1. A workflow log exposes the actual baseline SHA and its source, rather than requiring inference from `added_files.txt`.
2. Prior successful run metadata and checkout SHA are sufficient to explain a future baseline mismatch.
3. API error behavior, empty-result fallback, candidate selection, Telegram payload, and delivery behavior are unchanged.
4. No secrets or unrelated data are added to workflow logs.
5. The subsequent normal run passes workflow validation and satisfies the exact log assertions above.
