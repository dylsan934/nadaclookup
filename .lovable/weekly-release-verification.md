# October 21 release repair verification

## Completed
- Applied additive migration `0005_unified_published_nadac_snapshot.sql`; no destructive schema changes.
- Revalidated existing immutable releases before enabling new readiness fields; retained original completion times.
- Exact official CMS artifact: `https://download.medicaid.gov/data/nadac-national-average-drug-acquisition-cost-10-21-2026.csv`.
- The artifact contains cumulative yearly rows; repair selected only its 30,095 rows with As of Date October 21, 2026, preserving decimal strings, original record effective dates and leading-zero NDCs.
- Weekly extracted CSV SHA256: `0a43b83d8ae80a47e64748689e79c2d5362237a67fa19bbe0f68aba37e830fdf`.
- Compared exact October 21 versus staged October 14: **28,712 changed, 1,280 unchanged, 103 added, 39 removed, zero non-comparable, zero rejected**.
- Historical run `5d559781-904b-4b61-8f00-e976895e443d` finalized at **November 2, 2026, 19:06:30.908939 UTC**. All readiness fields completed; published/staged/expected counts each 30,095.
- Current-price reads now use the immutable published view; drug-page initial HTML rows and identity come from the same server read.
- Public invariant passed for search, drug pages, homepage and Movers release identity/date: October 21. Raw history maximum October 28 is reported as an effective-date mismatch and processing activity, not falsely marked as published.

## Verification results
- All **57 tests passed**, including full stage gates, failure after ingestion, rejected rows, retry, zero-change, October 21/14 identity, decimal/date preservation and no-send safety.
- Latest preview compilation/typecheck diagnostic: **build OK** (19:08:06 UTC); no manual build/typecheck or sitemap generation invoked.
- Real signed-in preview flow: exact Metformin package `00378718505` → drug page → calculator prefill, retaining price **0.01483** and October 21 effective date. Calculate button was not submitted; allowance unchanged.
- Real completed-run retry retained completion timestamp and preparation count.
- Browser reported zero page errors during public flow; inspected drug-page, calculator and homepage screenshots.
- Public route head coverage inspected, including index, Movers and drug loader metadata; existing app-specific title/description/OG/Twitter head handling preserved.
- Message counts remained **zero saved-drug events, 13 existing in-app alerts, two existing send logs, zero transactional queued emails**. Only one private preview-only preparation was added (six → seven).
- Existing admin page remained unreliable/blank or redirected in browser. Repair used the existing authenticated server-function actions with verified admin access and real account bearer; admin table presentation is **not verified**. Do not enable real sending on this evidence.

## Exact preview labels
- `October 28, 2026 data is processing. Last published release: October 21, 2026.`
- Homepage: `NDCs in the published release` / `30,095`; `Last CMS sync` / `Mon, Nov 2, 7:06 PM UTC`; `Prices effective Oct 21, 2026`.
- Homepage biggest mover: `Weekly Movers are still processing`.
- Movers: `Last published release: October 21, 2026 · comparison: October 21, 2026 vs October 14, 2026`.
- Movers: `Weekly Movers are still processing. No older ranking is shown as current.`

## Remaining boundaries
- No publishing or scheduler cutover performed. Hosted price readers are still the old app until published; sustained consistency requires separately authorized scheduler cutover.
- October 28 official artifact downloaded/dated read-only, but it has not been staged or published. Its unfinalized activity remains visible.
- No NADAC history rows/values changed by historical repair; history count after repair/retry 233,810.
- All four schedules retain their original schedule/active state; digest remains paused. No notifications sent, no billing/auth/formula/allowance changes, no services purchased.
- Sitemaps were already modified on initial inspection; they were not edited by this repair. Dev startup logs show pre-existing automated generation. This work did not invoke regeneration.