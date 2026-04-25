# Programmatic SEO: Dynamic NADAC Drug Pages

## Slug Format (approved)
`/drug/{kebab-drug-name}-nadac-price` — e.g. `/drug/amoxicillin-500-mg-capsule-nadac-price`

## 1. Slug Utilities — `src/lib/drug-slug.ts` (new)
- `drugNameToSlug(name)` → lowercase, non-alphanumeric → `-`, trim, append `-nadac-price`
- `slugToDrugSearchTerm(slug)` → strip `-nadac-price` suffix, replace `-` with space (used as DB lookup key)
- Since drug names aren't unique by slug alone, the page resolves the slug by querying `nadac_drugs` with case-insensitive name match and picks the latest `effective_date` row (and groups by NDC for the NDC list).

## 2. New Page — `src/pages/DrugPage.tsx`
Route: `/drug/:slug` (added to `src/App.tsx` above the catch-all)

Sections rendered server-friendly (plain HTML, no gating):
- **H1**: `{Drug Name} NADAC Price (Updated Weekly)`
- **Intro paragraph**: what the drug is (generic NADAC framing) + why NADAC matters to pharmacies
- **Current NADAC pricing block**: latest `nadac_per_unit`, `pricing_unit`, `effective_date`, `pharmacy_type`. If multiple NDCs exist for the name, show a compact table (NDC, price/unit, effective date) — capped at ~10 rows with link to search tool for the full list.
- **"How pharmacies use NADAC pricing for {drug}"**: 2–3 paragraph SEO content block (templated, drug name interpolated)
- **Related NADAC Drug Prices** (4–6 items): query `nadac_drugs` for drugs sharing the first significant token of the drug name (e.g. `amoxicillin%`), excluding self, distinct by name, latest effective_date. Anchor: `{Drug Name} NADAC Price` → `/drug/{slug}`
- **Learn More About NADAC Pricing**: hard-coded links with varied anchor text to:
  - `/what-is-nadac` ("What NADAC pricing means")
  - `/blog/nadac-vs-wac-explained` ("NADAC vs WAC vs AWP")
  - `/blog/calculate-reimbursement-from-nadac` ("Using NADAC for reimbursement")
  - `/how-often-does-nadac-update` ("Why NADAC prices change weekly")
  - `/blog/improve-pharmacy-margins` ("Improve pharmacy margins")
- **CTA**: "Search any drug using the NADAC Lookup Tool" → `/`
- **Breadcrumbs**: Home › Drugs › {Drug Name}

### SEO via `SEOHead`
- Title: `{Drug Name} NADAC Price (Free Lookup Tool for Pharmacies)`
- Description: `Check the latest NADAC price for {Drug Name}. Updated weekly. Built for independent pharmacies to compare acquisition costs.`
- Canonical: `https://nadaclookup.com/drug/{slug}`
- JSON-LD: `Drug` schema (`name`, `code` MedicalCode for NDC) + `BreadcrumbList`

### 404 handling
If no NADAC row matches the slug, render a friendly "Drug not found" with a search box and link to `/`.

## 3. Internal Linking from Existing Surfaces
- **`src/components/DrugCard.tsx`**: add a small `View full NADAC page →` link under the drug name pointing to `/drug/{slug}` (uses first NDC's drug name).
- **`src/pages/Index.tsx`**: add a "Popular NADAC drug pages" grid (~12 links) below existing content. Sourced from a small hand-picked list of common generics (amoxicillin, lisinopril, metformin, atorvastatin, etc.) — each rendered as `<Link>` with anchor `{Drug Name} NADAC Price`. Pure HTML for crawlability.
- **`src/components/Footer.tsx`**: add a "Popular Drug Prices" column with 6 links.

## 4. Scalable Sitemap — Edge Function
The 6,000+ drugs can't live in a static `public/sitemap.xml`. Convert sitemap to an index pointing at a dynamic edge-function-served sitemap.

### a) New edge function — `supabase/functions/sitemap-drugs/index.ts`
- Public (no JWT). CORS + `Content-Type: application/xml`.
- Queries `nadac_drugs` for distinct `drug_name` (paginated; supports `?page=N` returning 5,000 URLs per page to stay under the 50k sitemap limit).
- Outputs `<urlset>` with one `<loc>` per drug slug + `<lastmod>` from `MAX(effective_date)`.
- Cached at the edge with `Cache-Control: public, max-age=86400`.

### b) Convert `public/sitemap.xml` → sitemap index
Replaces the current single sitemap with:
```xml
<sitemapindex>
  <sitemap><loc>https://nadaclookup.com/sitemap-static.xml</loc></sitemap>
  <sitemap><loc>https://wcbzqrskgfszkwgrzogo.supabase.co/functions/v1/sitemap-drugs?page=1</loc></sitemap>
  <sitemap><loc>.../sitemap-drugs?page=2</loc></sitemap>
  ...
</sitemapindex>
```
- New `public/sitemap-static.xml` holds the existing 13 hand-curated URLs.
- Number of drug-sitemap entries determined by `ceil(distinct_drug_count / 5000)` — currently 2 pages.

## 5. Crawlability Note
This is a Vite SPA, so pages are JS-rendered. Google does render JS, but to maximize indexing we:
- Keep all content (H1, paragraphs, links) in the initial component tree (no lazy/conditional gating).
- Set proper meta tags via `react-helmet-async` (already installed).
- Provide the sitemap so Googlebot discovers every URL even without crawling links.
- (Optional future upgrade — not in this PR — prerendering via `vite-plugin-prerender` or moving to SSR. Flagging as a follow-up.)

## Files Changed
**New:**
- `src/lib/drug-slug.ts`
- `src/pages/DrugPage.tsx`
- `src/components/SEOHead.tsx` (already exists — reused)
- `supabase/functions/sitemap-drugs/index.ts`
- `public/sitemap-static.xml`

**Modified:**
- `src/App.tsx` — add `/drug/:slug` route
- `src/components/DrugCard.tsx` — add "View full NADAC page" link
- `src/pages/Index.tsx` — add "Popular NADAC drug pages" section
- `src/components/Footer.tsx` — add popular drugs column
- `public/sitemap.xml` — convert to sitemap index

## Out of Scope (flag for later)
- True SSR/prerendering (current SPA + sitemap is sufficient to start indexing)
- Drug class taxonomy (related drugs uses name-prefix heuristic; a real RxNorm/ATC class mapping would be a phase 2)
- Per-drug price history charts on the SEO page (can add once base pages are indexed)
