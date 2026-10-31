# Unify NADAC weekly publication

## Verified root cause
- The published pointer remains on **October 14, 2026**, completed **October 18 at 03:33:13 UTC**.
- The active legacy import writes directly into searchable history, which now contains records effective **October 28** and **33,145 distinct NDCs**. Those are not proof of a finalized weekly release.
- The independent legacy Movers job wrote an October 21 versus October 14 result with **1,000 changed records and no release identifier**. Treat that result as unverified, not as the repair's comparison.
- Homepage and Movers read the published pointer, while search, drug pages and other current-price readers independently select the newest history rows.
- Existing failure detection only recognizes staged runs after a publication exists; legacy ingestion does not create those runs, so newer activity is invisible to that check.

## What will change
1. Extend the existing release record, rather than introduce a competing publication authority. Retain source date, checksum/import identifier, start/completion times, imported/added/removed/non-comparable counts; add rejected-count accounting and explicit current-price and drug-page readiness.
2. Expose one read-only current-price snapshot tied to the successfully published run. Use it for search, drug pages and their initial page data, homepage counts, calculator lookup, related prices, watchlist prices and agent exact-NDC reads. Keep history stored separately and unchanged.
3. Require every data stage to pass before the published pointer advances. Publication remains atomic; retries retain their original identity and cannot create duplicate notification preparations.
4. Show newer ingestion as **processing** when downstream work is incomplete. Suppress stale biggest-mover/current-Movers claims; keep the last published snapshot clearly identified rather than expose incomplete prices as current.
5. Add a read-only consistency report comparing the release identity and publication date actually used by search, drug pages, homepage and Movers, including their readiness/counts. Fail publication on a mismatch.

### Date semantics
CMS **publication date (As of Date)** and each price's **Effective Date** are different facts. A valid weekly file can include older or future-effective records. The repair will preserve both; it will not rewrite row dates to make a literal maximum-effective-date equality pass. Report the requested raw maximum-effective-date mismatch separately from the authoritative cross-surface release-identity invariant.

## Proposed additive migration
- Add readiness fields and rejected-count accounting to `nadac_import_runs`.
- Add published-snapshot read access with narrowly scoped public SELECT access, using the existing `nadac_publication` pointer and immutable `nadac_release_records`.
- Extend validation/failure/finalization functions to cover new stages and verify full counts, the exact preceding release and shared snapshot identity.
- Extend public status to expose published and processing identities without leaking private notification or account data.
- Revalidate existing staged releases before marking their new stages complete; do not blindly mark stages successful.
- No tables, columns, history or NADAC values will be deleted, overwritten or renamed. Any destructive change would require a separate evidence review before application.

### Existing tables/functions involved
`nadac_drugs`, `nadac_import_runs`, `nadac_release_records`, `nadac_publication`, `weekly_movers`, `weekly_digest_preparations`; `nadac_begin_run`, `nadac_stage_records`, `nadac_validate_run`, `nadac_compare_run`, `nadac_prepare_digest`, `nadac_finalize_run`, `nadac_fail_run`, `nadac_public_status`, `nadac_ndc_count`; legacy `sync-nadac` and `weekly-movers` readers/jobs.

## October 21 backfill
1. Obtain the exact CMS October 21 CSV; verify its As of Date, checksum, full count, precise prices and rejected/duplicate accounting against the October 14 immutable snapshot.
2. Stage October 21 as a historical repair with October 14 as its immediately preceding release. Do not reconstruct that file from today's mutable history.
3. Validate current-price and drug-page reads, calculate the full comparison, build homepage statistics and prepare notifications strictly in dry-run mode.
4. Finalize only after all required stages pass. Preserve empty rankings if the independently verified comparison has zero changes.
5. Account for the already-present October 28 ingestion: October 21 must not be described as the newest CMS data without a visible October 28 processing warning. Obtain and validate the exact October 28 artifact before any subsequent publication; do not silently publish it as part of the October 21 backfill.

## Expected public text
After October 21 is finalized:
- Homepage: **“Prices effective: October 21, 2026”**, associated with the published weekly release; retain separate per-price effective dates.
- Homepage: **“Last CMS sync: [actual successful finalization time]”** — never an invented or file-download timestamp.
- Movers: **“October 21, 2026 vs October 14, 2026.”**
- While October 28 is unfinalized: **“October 28, 2026 data is processing. Last published release: October 21, 2026.”** No old biggest mover presented as current.
- If the verified comparison is zero: **“No comparable price changes in this weekly release.”** Display this only in the appropriately labeled published comparison, not as a claim about the pending week.

## Verification
**Baseline:** 30 existing weekly-pipeline and saved-alert safety tests passed in isolated local databases; no production messages were sent.

Add and run focused tests for:
- Complete release succeeds only after every stage.
- Failure after ingestion leaves the published pointer unchanged and shows processing.
- Safe retry preserves identity, completion time and one set of outputs.
- Zero-change week replaces older rankings.
- October 21 compares with October 14, never a different week.
- All public consumers use the same published run; raw effective dates stay unchanged.
- Retrying repair creates no duplicate alerts, preparations or queue entries.

Verify preview search → exact drug page → calculator selection alongside homepage/Movers with real published data; confirm queue/event counts remain unchanged. Inspect preview compilation errors through the provided diagnostics. Do not rerun sitemap generation or manually invoke builds/typechecks.

## Boundaries and deployment dependency
- No production emails, notifications, purchases, top-ups or charges; use only included credits.
- No authentication, OAuth consent, billing, subscription-limit or reimbursement-formula changes.
- No sitemap regeneration or unrelated generated-file edits; existing sitemap changes are outside this repair.
- Preserve legacy import schedules, paused digest and historical/no-catch-up safeguards. Do not invoke legacy alert senders.
- Preview code and a repaired pointer alone cannot guarantee lasting production consistency: the hosted app must eventually be published and the legacy orchestration cut over. Those actions remain blocked on separate explicit deployment/scheduler authorization; this repair will not perform them.