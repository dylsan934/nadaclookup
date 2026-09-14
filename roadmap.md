# Roadmap

## SEO architecture fix via TanStack Start migration
- [x] Audit current routing/metadata/canonical/robots/sitemap
- [x] Preflight build check (green)
- [ ] Run migrate-to-tanstack (Steps 0–10) — preview only, no publish
- [ ] Centralized per-route SEO (title, description, canonical, robots, OG, JSON-LD) served in initial HTML
- [ ] Calculator: index,follow (remove noindex); private pages stay noindex
- [ ] One H1 per page; homepage hero H1 only on homepage
- [ ] Drug pages: metadata from normalized drug record (no %-encoded placeholders)
- [ ] Validate initial HTML for /, /reimbursement-calculator, /movers, /blog/nadac-vs-wac-explained, one drug page, one private page (title, description, canonical, robots, H1 count, content, sitemap presence, status)
- [ ] Sitemap matches canonical URLs
- [ ] Report results; user publishes manually (blocker: user decision to publish)
