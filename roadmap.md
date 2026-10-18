# Roadmap

## Weekly data-finalization audit and repair
- [x] Inspect existing imports, schedules, available logs, Movers SQL, public labels and digest flow
- [x] Download and compare September 30, October 7 and October 14 CMS releases read-only
- [x] Run existing tests and present evidence, proposed changes, backfill and public wording
- [x] Implement durable stages, consecutive-release comparison, private digest preparation and 11 pipeline/parser regression tests
- [x] Apply additive migrations and backfill September 30 baseline, October 7 and October 14 chronologically; preserve all existing searchable pricing values
- [x] Verify corrected homepage and Movers after cache invalidation; 19 regression tests passed, preview healthy
- [ ] Activate automatic weekly orchestration and publish the public changes (blocker: explicit deployment permission; existing cron targets intentionally unchanged)
- [ ] Release real notifications (blocker: explicit permission; all repair preparations remain permanently preview-only)

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
