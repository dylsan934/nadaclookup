# Roadmap

## October 21 published-release consistency
- [ ] Inspect current ingestion, publication, search, drug pages and public statistics; report root cause
- [ ] Prepare a non-destructive release-selection repair and October 21 versus October 14 backfill plan
- [ ] Implement and test shared published-release reads, durable stage gates and cross-surface invariants
- [ ] Finalize October 21 using immutable CMS snapshots; notifications and emails stay dry-run
- [ ] Verify exact homepage/Movers text and public date consistency; no scheduling changes or publish without separate permission

## Agent integrations
- [x] Add OAuth-protected exact-NDC lookup and account watchlist tools, plus browser search-page tools
- [x] Verify generated two-tool catalog, 11 regression tests, signed-out consent return, invalid requests, approve/deny, already-authorized redirects and real account watchlist/exact-NDC reads; build OK
- [ ] Verify hosted login/signup return and assistant connection after republishing (blocker: publication; local OAuth provider calls require a canonical-origin test bridge, and native WebMCP is unavailable in the test browser)
- [ ] Republish agent integrations (blocker: user publishing decision; no publishing authorization given)

## Weekly data-finalization audit and repair
- [x] Inspect existing imports, schedules, available logs, Movers SQL, public labels and digest flow
- [x] Download and compare September 30, October 7 and October 14 CMS releases read-only
- [x] Run existing tests and present evidence, proposed changes, backfill and public wording
- [x] Implement durable stages, consecutive-release comparison, private digest preparation and 11 pipeline/parser regression tests
- [x] Apply additive migrations and backfill September 30 baseline, October 7 and October 14 chronologically; preserve all existing searchable pricing values
- [x] Verify corrected homepage and Movers after cache invalidation; 19 regression tests passed, preview healthy
- [ ] Activate automatic weekly orchestration and publish the public changes (blocker: explicit deployment permission; existing cron targets intentionally unchanged)
- [ ] Release accurate saved-drug email notifications (permission received; verify finalized-release safety before sending; historical preparations remain permanently preview-only)

## Email accuracy safeguards
- [x] Audit existing send paths, finalized data, duplicate prevention and recipient eligibility: legacy digest skips zero-change weeks; legacy alerts bypass finalized runs, preferences and shared sending safeguards
- [x] Pause legacy weekly digest schedule, preserving its Wednesday 14:00 UTC configuration
- [x] Add finalized-release preview, activation cutoff, private recipient eligibility, event identities, atomic queue handoff and delivery-time rechecks
- [x] Verify 29 accuracy/pipeline checks and authenticated read-only preview: seven saved drugs blocked as historical; zero events, zero queued messages, activation unset
- [ ] Verify private preview displayed in the admin page and delivery end-to-end (blocker: admin page renders blank in browser despite direct authenticated preview succeeding; live queue must stay empty until this passes)
- [ ] Retire unsafe legacy saved-drug sender (blocker: platform requires migrated app published and verified first; existing sync still invokes it)
- [ ] Activate future-release alerts and connect automatic trigger (blocker: publishing/scheduler permission; activation remains unset and no historical catch-up allowed)

## SEO architecture fix via TanStack Start migration
- [x] Audit current routing/metadata/canonical/robots/sitemap
- [x] Preflight build check (green)
- [x] Run migrate-to-tanstack (Steps 0–10) — preview only, no publish
- [x] Centralized per-route SEO (title, description, canonical, robots, OG, JSON-LD) served in initial HTML
- [x] Calculator: index,follow (remove noindex); private pages stay noindex
- [x] One H1 per page; homepage hero H1 only on homepage
- [x] Drug pages: metadata from normalized drug record (no %-encoded placeholders)
- [x] Validate initial HTML for /, /reimbursement-calculator, /movers, /blog/nadac-vs-wac-explained, one drug page, one private page (title, description, canonical, robots, H1 count, content, sitemap presence, status)
- [x] Sitemap matches canonical URLs (sitemap.xml + static + drug sitemaps preserved, served 200)
- [ ] Report results; user publishes manually (blocker: user decision to publish)
