## Goals
1. Remove the three how-to walkthrough videos site-wide.
2. Tighten the homepage so it reads as: search → quick value → conversion, without the wall of stacked sections.

## 1. Remove the videos

Delete usage and assets:
- `src/components/HowToVideo.tsx` — delete component.
- `src/pages/Index.tsx` — remove `HowToVideo` import and the `<HowToVideo />` block under the search.
- `src/pages/ReimbursementCalculator.tsx` — remove the `<HowToVideo />` and import.
- `src/pages/SavedDrugs.tsx` — remove the `<HowToVideo />` and import.
- `public/videos/` — delete all 6 files (`how-to-search.mp4` + poster, `how-to-calculator.mp4` + poster, `how-to-alerts.mp4` + poster).
- `remotion/` — delete the entire directory (Remotion source for the videos).

This leaves no dead imports, no orphaned MP4s, and no Remotion build tooling.

## 2. Declutter the homepage

Current pre-search stack on `/`:
`CalculatorHeroPromo` → sticky search → helper text → `DataStatus` → results area → **HowToVideo** → `HomePricing` (full pricing block with two cards + ROI copy) → `HomeSEOContent` (5 sections: What is NADAC, Why use it, How it works, FAQ, Resource links) → `PopularDrugLinks`.

That's ~9 stacked sections before the fold ends. Plan:

**a. Drop the calculator promo block above the search.**
The page's primary job is NADAC lookup. The calculator already has a nav link and its own page. Replace the big gradient promo with a single slim inline link under the helper text ("Need to estimate reimbursement? Open the calculator →"). Removes one full hero-sized section.

**b. Replace the full pricing block with a compact upgrade strip.**
`HomePricing` renders two full pricing cards plus an ROI section on the homepage — duplicates `/pricing`. Replace with a one-line card: "Pro · $29/mo — price history, alerts, unlimited saves" + "Start 7-day trial" button + "See all features" link to `/pricing`. Keep `HomePricing` component intact (still used on its own page if needed) but stop rendering it on `Index`; render a new lightweight `HomeProUpsell` instead.

**c. Trim `HomeSEOContent` to two sections.**
Keep the "How it works" 3-step section and the FAQ (both have SEO value via FAQ JSON-LD and clear user value). Remove:
- "What Is NADAC?" intro paragraph (covered by `/what-is-nadac`).
- "Why Use NADAC Pricing…" 3-card grid (marketing repetition; the FAQ + how-it-works carry the message).
- The bottom "Learn More About NADAC Pricing" button row (links already in footer/nav).

Also reduce vertical rhythm: change `space-y-16 py-8` → `space-y-12 py-4`, and section heading sizes from `text-2xl md:text-3xl` → `text-xl md:text-2xl` so the page breathes without each section shouting.

**d. Tighten `PopularDrugLinks`.**
Reduce from 12 drugs to 8, drop the redundant subhead paragraph, keep the heading + grid. Reduces a full-width list block by a third.

**e. Re-order and gate.**
Final pre-search order on `Index.tsx`:
```
Header / SiteNavigation
Sticky SearchBar (no promo above it)
Helper text + inline calculator link
DataStatus (only when relevant)
[results slot]
— below only when !hasSearched —
How it works (3 steps)
FAQ
HomeProUpsell (compact)
PopularDrugLinks (8 items)
Footer
```

After-search view stays minimal: only results show; SEO/pricing/popular blocks remain hidden so the user focuses on the data they searched for.

## Files touched
- Delete: `src/components/HowToVideo.tsx`, `remotion/`, `public/videos/*`
- New: `src/components/HomeProUpsell.tsx` (small compact upsell strip)
- Edit: `src/pages/Index.tsx` (remove promo + video, swap pricing for upsell, reorder)
- Edit: `src/components/HomeSEOContent.tsx` (drop 3 sections, smaller headings, tighter spacing)
- Edit: `src/components/PopularDrugLinks.tsx` (8 items, drop sub-paragraph)
- Edit: `src/pages/ReimbursementCalculator.tsx`, `src/pages/SavedDrugs.tsx` (remove video usage)

## Out of scope
- No copy rewrites beyond the trims above.
- `HomePricing` and `CalculatorHeroPromo` components are kept in the repo (unused on Index) in case they're wanted elsewhere — say the word and I'll delete them too.
