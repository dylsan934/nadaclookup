# November publication repair verification

## Implemented and applied
- Additive migrations 0006–0009 add private append-only stage outcomes, source identity, retry counts, deadlines, derived overdue failure display, publication timestamps and immutable finalized Movers protection.
- Detection, download and validation no longer require a completed predecessor. Private comparisons require the exact preceding validated snapshot; public finalization still requires the preceding completed release.
- Authenticated administrator controls validate CMS artifacts and retry preparation only. Finalization was removed from the browser action schema. No checkout, billing lookup, alert or email queue calls occur in this repair path.
- Prepared stages use `awaiting_review`, not indefinite processing. Active attempts time out after two hours; expired status is visible on reads and persisted when orchestration resumes.
- Public invariant now checks linked Movers totals, rankings, dates and identity. Existing October 21 Movers corruption remains flagged, not silently corrected.

## Real authenticated verification
- Administrator screen verified through the actual account's signed-in navigation, including the private table and failure/retry notices. Direct cold navigation can redirect before account hydration; no authentication rules were changed.
- Compared every one of 30,095 normalized October 21 CMS rows against the immutable stored baseline before October 28 staging: all matched. CSV byte-checksum difference did not indicate a normalized price/date difference.
- Downloaded and validated October 28, November 4 and November 11 independently. Private chronological comparison/preparation then ran and was repeated through the actual admin UI.
- November 4 and November 11 initially retained comparison failures while the old completed-predecessor preview gate was present; these private attempts remain in history. Their retries succeeded once preview comparisons used exact validated snapshots. Each records one retry.

| Release | Rows | Changed | Unchanged | Added | Removed | Non-comparable | State |
|---|---:|---:|---:|---:|---:|---:|---|
| October 28 | 30,167 | 3 | 30,091 | 73 | 1 | 0 | awaiting_review |
| November 4 | 30,102 | 0 | 30,102 | 0 | 65 | 0 | awaiting_review |
| November 11 | 30,157 | 0 | 30,090 | 61 | 6 | 6 | awaiting_review |

## Safety and tests
- All 63 tests across 7 files passed, including six new regression cases for independent later validation, timeout, independent identities, sanitized failures, immutable Movers and awaiting-review publication isolation.
- Preview compilation/typecheck reports build OK. No manual build/typecheck or sitemap generation.
- Published view remains October 21, 30,095 NDCs. History remains 233,871 rows, latest write November 11 06:00:20 UTC. Zero saved-drug events; two existing email logs. Repair code has no queue calls and used empty recipients.
- All four cron jobs retain their previous schedule and active state; digest remains paused.
- No app deployment, scheduler change, public-pointer advance, price edit, production alert, email, billing operation or new service.

## Public status and remaining authorization
- Current wording: “Publication delayed — October 21 remains the last verified release.”
- After separately approved finalization: “Last verified CMS release: November 11, 2026 · 30,157 NDCs.”
- November 11 Movers: zero comparable changes versus November 4; 61 added, 6 removed, 6 non-comparable.
- Live finalization and automatic scheduler cutover remain unauthorized. Replacement scheduler endpoint is not connected or deployed; the reusable validated-download orchestrator is ready for that separately authorized integration.
- Protecting finalized Movers prevents further legacy overwrite but does not repair the already-corrupted October 21 linked summary. Restoring that derived summary needs a separately reviewed repair; prices and release snapshots remain untouched.
- Before scheduler cutover, verify legacy sender retirement and invocation authorization. No sender was invoked during this task.
- Rollback: keep October 21 pointer; revert app presentation if needed, retain additive audit objects and private snapshots. Failed finalization rolls back transactionally. No historical data deletion is required.