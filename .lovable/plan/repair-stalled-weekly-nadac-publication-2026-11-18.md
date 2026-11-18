# Repair stalled weekly NADAC publication

## Verified root cause

The automatic jobs still call the legacy `sync-nadac` and `weekly-movers` functions, not the transactional release pipeline. Imports therefore do not create a release-run record or finalize the publication pointer. The pointer remains October 21, with exactly 30,095 published NDCs; no October 28, November 4 or November 11 run exists.

The public “processing” date is `max(effective_date)` from legacy history, not a detected CMS release. It collapses all unfinished activity into one date and cannot identify a failed download or a zero-change publication. November 4's exact CMS file has a maximum record effective date of October 28, so this method cannot detect that release correctly.

Other verified defects:
- `sync-nadac` logs batch errors but continues and treats any inserted rows as success. It directly upserts history and invokes the legacy alert sender. Do not invoke it during repair.
- `weekly-movers` writes by effective date without a release ID and does not finalize zero-change weeks. It can overwrite a finalized Movers row: the October 21 run records **28,712** comparable changes, but its linked `weekly_movers` row currently says **1,000**. The current invariant does not catch this count mismatch.
- `nadac_begin_run` requires the immediately preceding release to be completed before a new run can even start. This creates head-of-line blocking for download and validation.
- There is no processing deadline, durable download status, retry count, append-only attempt history or administrator timeout notice.
- Existing failure storage truncates arbitrary error text but does not sanitize it.

Cron records report dispatch success on all three Wednesdays. This only verifies submission of an asynchronous HTTP request, not import or publication success. Recent function logs were unavailable; exact historical HTTP errors and batch failures cannot be reconstructed from available evidence. Do not invent failure reasons.

## Missing release status

| CMS release | Permanent run | Scheduler dispatch | Current evidence |
|---|---|---|---|
| October 28 | Absent | Submitted successfully | Legacy history contains 73 rows effective October 28; no validated immutable release or publication |
| November 4 | Absent | Submitted successfully | Exact CMS file available; latest record effective date October 28; no separate run or verified publication |
| November 11 | Absent | Submitted successfully | Legacy history contains 61 rows effective November 11; no validated immutable release or publication |

History contains 233,871 rows, last written November 11 at approximately 06:00:20 UTC. These counts are record-effective-date counts, **not complete weekly snapshot counts**. Legacy writes have occurred; whether individual batches failed is unverified. There are no partial immutable staging rows for these missing runs.

## Completed dry-run backfill

Downloaded each exact CMS As of Date CSV and validated it using the existing Papa Parse parser. Preserved decimal prices, leading-zero NDCs and original record effective dates. Ran staging, validation, comparison, empty-recipient preview preparation, finalization and repeated stages in an isolated temporary PostgreSQL-compatible database only.

| Release | Imported | Rejected | Changed | Unchanged | Added | Removed | Non-comparable |
|---|---:|---:|---:|---:|---:|---:|---:|
| October 28 vs October 21 | 30,167 | 0 | 3 | 30,091 | 73 | 1 | 0 |
| November 4 vs October 28 | 30,102 | 0 | 0 | 30,102 | 0 | 65 | 0 |
| November 11 vs November 4 | 30,157 | 0 | 0 | 30,090 | 61 | 6 | 6 |

All three simulated finalizations passed the cross-surface publication-date and count invariant. Repeating stages retained one Movers row per release. Zero history writes, email logs or queued emails were created in the rehearsal. October 21 was a staging-only baseline in that isolated rehearsal, not a simulated public publication.

Downloaded CSV SHA-256 identities:
```text
2026-10-21 49bbe44683adddd943353153ad21e0fced8681a4f311fcf325c128fd708be2a8
2026-10-28 f21915a954b1cb90a02f189ae59c6caaadc901ae1134418d3df23f4c8769a65f
2026-11-04 c111f45d9800188035d99d6090fce2a3977bf251474ea4e1f12279ba4b52c7d4
2026-11-11 0cff253f647b8e44afcd0cc83e81897050051e5b7db01c4a8f1897bc7087f37d
```

The re-downloaded October 21 CSV has the same validated count but a different checksum from the stored October 21 artifact. Before live staging, compare every normalized October 21 row against the stored snapshot; do not replace that published snapshot or assume byte differences are only formatting. The dry-run above compares the newly downloaded exact CMS files, not a verified row-for-row match to the stored baseline.

## Proposed repair

1. **Permanent detection and attempts.** Extend existing runs additively with source identity/URL, detected time, download and validation status, retry count, last attempt time, failure stage and published time. Add a private append-only attempt/stage log with timestamps, counts and sanitized outcomes. Register each release before download; use a zero default for expected count until download validation establishes it. Keep existing finalized snapshots immutable and correction checks intact.
2. **Independent early stages.** Allow each week's detection, download, staging and validation regardless of predecessor completion. Link the exact preceding validated snapshot for comparison later. A failure on October 28 must not prevent November 4 or November 11 from being downloaded or validated.
3. **Explicit comparison policy.** Rebuild chronologically. If an intermediate snapshot is unusable, record an explicit comparison-unavailable state; do not silently compare across a gap or publish it as a normal weekly Movers comparison. Resolve the intermediate source first or seek approval for a clearly labeled gap policy.
4. **Idempotent retry.** Keep `(run_id, ndc)` uniqueness and atomic stage transactions. Retrying an incomplete stage preserves completed stages and appends an attempt entry. Use bounded download timeouts and retry accounting; reject conflicting artifact metadata. Historical notification preparations remain permanently preview-only, with no queue or alert writes.
5. **Timeout and notice.** Propose a two-hour deadline per active processing attempt, independent of initial detection. Persist deadline failures when orchestration resumes; derive an overdue failed display immediately from timestamps so abandoned work cannot remain visibly processing forever. Show an administrator-only notice containing release date, failed stage and the specific retry action. No administrator email or production notification during repair.
6. **Atomic publication.** Gate publication on validated download/staging, current prices, drug-page data, Movers, homepage counts and freshness readiness. Preserve private preview-only preparation. Move the pointer and write linked Movers only in one transaction. No live backfill finalization before separate review approval: even historical finalization changes the shared public pointer.
7. **Protect release-linked Movers.** Prevent the legacy sender/calculation path from modifying finalized linked release rows. Verify Movers totals, comparison dates, run identity and rankings against the finalized run, not only the publication date. Preserve history and CMS prices.
8. **Small private status view.** Extend the existing WeeklyRunPanel with detected releases, attempt counts, per-stage status, counts, sanitized failures, overdue notices and stage-specific retry actions. Do not automatically finalize uploaded files in a review/dry-run flow.
9. **Automatic cutover only after review.** Prepare the replacement orchestration using the existing application server boundaries, without creating services or changing current schedules. Publishing, legacy sender retirement and changing scheduler targets require separate authorization and hosted verification.

## Affected functions and tables

**Existing code:** `supabase/functions/sync-nadac/index.ts`, `supabase/functions/weekly-movers/index.ts`, `src/lib/weekly-admin.functions.ts`, `src/lib/weekly-publication.ts`, `src/lib/weekly-publication.functions.ts`, `src/components/WeeklyRunPanel.tsx`, public homepage/Movers status rendering and weekly tests.

**Existing database objects:** `nadac_import_runs`, `nadac_release_records`, `nadac_publication`, `nadac_published_drugs`, `weekly_movers`, `weekly_digest_preparations`, and the `nadac_begin_run`, `nadac_stage_records`, `nadac_validate_run`, `nadac_compare_run`, `nadac_finalize_run`, `nadac_fail_run`, `nadac_public_status`, `nadac_public_invariant` functions. Legacy history remains untouched by repair.

**Proposed additive migration:** extend the existing run record; add one private append-only attempt table with explicit grants and admin-only read policies; replace the relevant service-only RPC bodies and public sanitized status/invariant functions. No migration has been applied for this request. Full SQL will be prepared after approval of this approach and before live application.

## Automated verification

All **57 existing tests across 7 files passed**. Existing integration tests cover cross-surface dates, finalization gates, failure preserving publication, retry deduplication, no email queue writes, rejected records, zero-change weeks and effective-date preservation.

New behavior is not implemented or verified yet. Add tests for:
- Later download/validation after predecessor failure.
- Every detected release retaining independent history.
- Timeout becoming a failed public/private state.
- Sanitized errors and retry attempt counts.
- Completed Movers rows resisting legacy overwrite and count/ranking mismatch detection.
- Real CMS chronological dry-run fixtures, including November 4 with no new record-effective date.

No manual build, typecheck, sitemap generation, production alerts, billing actions or deployment was performed. Existing preview compilation is green. Authenticated admin presentation must be verified after repair; previous blank-page behavior remains unresolved.

## Rollback and boundaries

- Until approved live finalization, the October 21 pointer and 30,095 verified NDCs remain unchanged.
- Additive schema and private attempt logs do not remove or rewrite existing data. Revert application changes if verification fails; leave audit records intact.
- If a later approved publication fails its gate, its transaction rolls back and the prior complete release remains published.
- If a defect is found after publication, use a separately reviewed service-only pointer restoration to the prior immutable complete snapshot; do not edit prices or erase failed attempts.
- Keep import schedules and paused digest schedule unchanged in this phase. Do not call any sender or enable alerts.
- Existing unrelated dirty files (`bun.lock` and three sitemap XML files) predate this investigation and must not be included in its commit.

## Exact proposed public wording

**While delayed:** “Publication delayed — October 21 remains the last verified release.”

**After approved November 11 recovery:** “Last verified CMS release: November 11, 2026 · 30,157 NDCs.”

**Movers after recovery:** “November 11, 2026 vs November 4, 2026 — no comparable price changes. 61 NDCs added, 6 removed, 6 non-comparable.”

**Sync timestamp:** show the actual successful finalization time, not a guessed historical timestamp. Individual drug Effective Dates remain unchanged.