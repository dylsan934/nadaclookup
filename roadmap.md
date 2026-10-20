# Roadmap

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
- [ ] Verify safeguards and authenticated private preview without sending real mail
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
