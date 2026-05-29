## Goal

Create a dedicated SEO landing page targeting **"how to compare prescription drug prices"** (KDI 50, ~590/mo) and related long-tail variants. The page positions NADAC Lookup as the neutral, government-sourced alternative to coupon apps and insurer tools.

## New route

- Path: `/compare-prescription-drug-prices`
- File: `src/pages/CompareDrugPrices.tsx`
- Registered in `src/App.tsx` above the catch-all

## Page structure

1. **Hero** — H1: "How to Compare Prescription Drug Prices". One-sentence value prop + primary CTA to the lookup tool on `/`.
2. **The problem** — Short explainer: coupon apps show *negotiated retail*; insurers show *plan-specific*; NADAC shows what pharmacies *actually pay*. Why that matters.
3. **Comparison table** — NADAC vs GoodRx vs Insurer pricing across: source, what it measures, update cadence, neutrality, best use case.
4. **Step-by-step guide** — Numbered "How to compare" steps (search drug → review NADAC → check unit price → compare strengths/forms → save & track).
5. **Inline lookup CTA** — Search box (reuse existing `DrugSearch` component) so users can act without leaving.
6. **FAQ** — 5–6 questions (What is NADAC? Is it the price I pay? How often does it update? NADAC vs WAC? Why not just use GoodRx? Can I track changes?). Wired to FAQ JSON-LD.
7. **Related links** — Internal links to `/what-is-nadac`, `/blog/nadac-vs-wac-explained`, `/how-often-does-nadac-update`, `/movers`, `/pricing`.

## SEO

- `<title>`: "How to Compare Prescription Drug Prices (NADAC Guide)" (<60 chars)
- Meta description (<160 chars) targeting the keyword
- Canonical: `https://nadaclookup.com/compare-prescription-drug-prings`
- Single H1, semantic H2/H3
- JSON-LD: `Article` + `FAQPage` + `BreadcrumbList`
- Add URL to `public/sitemap.xml` (root sitemap, `priority=0.9`, `changefreq=monthly`)
- Internal linking: add a link to this page from the homepage hero subtext and from `/what-is-nadac`, `/blog/nadac-vs-wac-explained`, and the site footer

## Design

Reuse existing semantic tokens and shadcn components — match the look of `/what-is-nadac` and `/pricing`. No new design system tokens.

## Out of scope

- No new backend tables, edge functions, or data sync changes
- No new pricing/auth logic
- Not rebuilding the comparison logic from `/movers` or `ComparisonView`

## Files touched

- `src/pages/CompareDrugPrices.tsx` (new)
- `src/App.tsx` (add route)
- `public/sitemap.xml` (add URL entry)
- `src/pages/Index.tsx`, `src/pages/WhatIsNadac.tsx`, `src/pages/BlogArticle.tsx` (or blog content), footer component — small internal-link additions
