# Repair weekly finalization and Movers

## Audit result

The stale display is confirmed. Search contains records effective October 14, but the latest saved Movers row is October 1 versus September 23. That creation time is incorrectly labeled “Last CMS sync.”

**Root causes verified in code and data:**
- Importing, calculating Movers and sending digests are three independent Wednesday jobs (06:00, 07:00 and 14:00 UTC), with no shared run record or success dependency.
- The importer discards CMS **As of Date** (the weekly release date). Stored **Effective Date** belongs to each drug's price, not to the full weekly snapshot. Selecting only October 14 effective rows gives four NDCs; October 7 gives 61, with no overlap. These are not complete releases.
- The Movers calculation walks backward until it finds changes. It compares individual prior price records rather than two explicit consecutive snapshots. Zero-change results are not saved, and the page/digest filter them out.
- The homepage mixes the newest drug effective date with an unrelated Movers creation timestamp. 
- Import batch errors do not prevent a partial import being reported successful. Import retries also invoke real price alerts.

**What logs establish:** scheduler history says requests were dispatched successfully, not that their processing succeeded. Recent sync/Movers function logs are unavailable. There is insufficient retained evidence to identify the exact October 7/14 Movers execution failure; the architectural causes above are confirmed, not a guess about that missing error.

## Read-only source comparison

Exact CMS releases were downloaded and verified read-only.

| Comparison | Previous rows | Current rows | Added | Removed | Non-comparable | Unchanged | Changed NDCs |
|---|---:|---:|---:|---:|---:|---:|---:|
| October 7 vs September 30 | 30,079 | 30,048 | 61 | 92 | 0 | 29,985 | 2 |
| October 14 vs October 7 | 30,048 | 30,031 | 4 | 21 | 3 | 30,024 | **0** |

Matching requires normalized NDC, description, unit, pharmacy type and valid prices. October 7 changed two BCG (TICE STRAIN) VIAL packages (one grouped card). October 14 has three identity/unit/pharmacy mismatches, counted as non-comparable.

The correct October 14 biggest-mover state is **no comparable price changes**, not SOLU-CORTEF +25.6%.

## Proposed result

Give each weekly release one durable record with its source dates, checksum, import start, ingestion completion, final completion, every required stage status, counts and failure details. A run becomes **current** only when every stage succeeds.

Use immutable release snapshots to compare October 14 directly with October 7. Preserve underlying NADAC numeric values, NDC leading zeros, record-level effective dates, search behavior, authentication, entitlements and Stripe configuration.

Show all date labels and the biggest mover from one finalized publication. If newer pricing is searchable before finalization, clearly mark the pending comparison and suppress the older biggest mover. Zero-change weeks are successful published comparisons with empty ranking lists and reconciliation counts.

Keep digest **preparation** separate from sending. Repair and backfill prepare previews only: no email queue insertion, alert invocation or provider send. Authorized admin previews show selected recipients and rows privately; public data never includes recipient details.

## Technical changes

### Existing functions and tables involved
- `sync-nadac`: CMS download, parsing, batched upserts, automatic alert invocation.
- `compute_weekly_movers()` and `weekly-movers`: comparison and saved rankings.
- `send-movers-digest`, `check-price-alerts`, `send-transactional-email` and the email queue: existing notification side effects.
- `nadac_drugs`, `weekly_movers`, `profiles`, `user_roles`, `saved_drugs`, `price_alerts`, `email_send_log`; existing cron jobs and run history.
- `src/lib/nadac-api.ts`, `DataStatus`, homepage, Movers and admin views; existing search/drug reads must remain coherent.

### Proposed schema
- `nadac_import_runs`: source As of Date, validated maximum price Effective Date, previous run, checksum, started/ingested/finalized timestamps, stage statuses, validation/reconciliation counts and private failure information.
- `nadac_release_records`: immutable, validated records by run and normalized NDC, retaining description, exact price, unit, pharmacy type and record-level effective date. Ambiguous duplicates fail validation or become explicit non-comparable records; never silently overwrite them.
- `nadac_publication`: a singleton current-run pointer plus the safe public status projection. Only finalized runs advance the pointer; separately expose newer searchable ingestion as pending.
- Link `weekly_movers` to its run and previous run; persist zero changes and added/removed/non-comparable counts. Unique run identity prevents duplicate results.
- `weekly_digest_preparations`: private preparation identity unique by `(run, user, digest kind)`, with a stable content identity and no automatic enqueue-on-insert. Resolve emails privately from Auth, not public profiles.
- Explicit grants and row-level policies on every new table; public reads limited to safe finalized/pending fields. Failure details and recipients are admin/service-only.

### Proposed processing and publication
1. Download, validate and stage the complete release. Any failed batch prevents import success.
2. Use locks, unique source/run identities and durable stage status to resume failed work without reimporting or invoking alerts.
3. Compare two explicitly selected complete releases; account for every row and persist zero-change results.
4. Prepare homepage statistics and private digest previews without sending or queueing.
5. Atomically publish searchable-data activation, Movers, statistics, freshness and the current-run pointer after all stages succeed. Existing October 14 data remains searchable with a pending label until repaired.
6. Record failures and resume only incomplete stages.

External downloads cannot share a database transaction; staging and atomic publication keep partial work from becoming current. Existing schedules remain unchanged until a separately authorized cutover. New server code uses TanStack server functions/routes, not new legacy functions. This project lacks the generated managed HTTP scheduling helper; do not invent a scheduler authentication migration or add polling.

Digest selection preserves Pro/trial/admin/opt-in entitlements. Replace the ineffective service-originated per-user subscription lookup with a verified private resolver using the same rules, without changing Stripe settings. The existing test-recipient path sends real email and is not a dry run.

## Backfill plan

1. Require approval before applying schema or running a backfill: preview and production share the same backend.
2. Validate/archive the September 30 baseline and the October 7 and October 14 exact releases with provenance and checksums, without overwriting existing pricing values during repair.
3. Backfill October 7 against September 30, then October 14 against October 7, in that order. Record the verified counts above and review the non-comparable rows.
4. Prepare private recipient/row previews only. Do not enqueue historical emails or replay saved-drug alerts. Mark historical preparations preview-only and not dispatchable.
5. Finalize October 14 only when every stage succeeds; record the actual repair completion timestamp, never invent a historical completion time.
6. Invalidate homepage, Movers and shared freshness-query caches by published run identity. No corresponding homepage/Movers CDN cache was found; do not promise a purge service that does not exist. Verify both views read back the same run and dates after the approved deployment.

## Tests and verification

**Completed now:** existing automated tests **8/8 passed** across both test files. Read-only CMS checks passed for exact October 7/14 release labels, unique NDC counts and full row accounting; September 30 baseline also verified. No write or email endpoint was called.

**Not yet implemented or tested:** the eight requested pipeline regression cases. They will be added with the repair and run before any approved production backfill:
1. Full successful run advances current only after every stage succeeds.
2. Movers failure after ingestion records an error and keeps the run unfinalized.
3. Retry reuses run/records and resumes only incomplete stages.
4. Zero-change week publishes empty Movers, not an older result.
5. October 14 requires the October 7 baseline, never October 1.
6. Homepage and Movers expose the same finalized run and dates.
7. Repeated preparation creates only one digest identity per recipient/run; dry-run creates no sends or queue messages.
8. Newer failed/pending run suppresses stale biggest mover.

Use isolated fixtures plus database integration checks for uniqueness and atomic publication. Public read-back waits for approved backfill/deployment.

## Exact public text after repair

**Homepage**
- “Last CMS sync” → actual finalization timestamp, formatted in UTC; not September 30 or an invented backdated time.
- “Prices effective Oct 14, 2026”
- “This week's biggest mover” → “No price changes this week”

**Movers**
- “Latest changes: October 14, 2026 vs October 7, 2026”
- “Newest CMS data: October 14, 2026”
- “No comparable NADAC prices changed between October 7 and October 14, 2026.”
- “4 NDCs added · 21 NDCs removed · 3 non-comparable NDCs”

**If Movers fails after pricing becomes available**
- “October 14 pricing is available; weekly Movers are still processing.”
- No SOLU-CORTEF card or older rankings presented as current. Any historical comparison is explicitly labeled with its own dates.

## Approval boundary

This turn is an audit and proposal only. No schema, pricing records, schedules, production functions or public site were changed; no emails were sent. Approving implementation does not authorize deployment or real email sending.