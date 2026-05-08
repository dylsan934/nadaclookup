
## Top 10 Biggest Movers — Weekly Price Changes

Automatically compute and display the top 10 drugs with the largest price increases and decreases each week when CMS releases new NADAC data.

### What you'll get

- A new `/movers` page showing two tables: **Top 10 Increases** and **Top 10 Decreases**
- Each entry shows: drug name, old price, new price, % change, effective date
- Data updates automatically when the weekly sync runs (no manual work)
- Links from the homepage and navigation for discoverability
- Each drug links to its pSEO drug page
- SEO-optimized with meta tags targeting "NADAC price changes this week"

### How it works

1. **New edge function (`weekly-movers`)** — Compares the two most recent weekly NADAC snapshots in the database, calculates % change per NDC, and returns the top 10 increases and top 10 decreases. Results are cached-friendly since they only change weekly.

2. **New page (`src/pages/WeeklyMovers.tsx`)** — Fetches from the edge function and displays two card/table sections with increase/decrease indicators, color-coded badges, and links to individual drug pages.

3. **Route & navigation** — Add `/movers` route in App.tsx. Add a link in the site navigation and homepage.

4. **SEO** — Meta tags, JSON-LD, and a link in the static sitemap for the movers page.

### Technical details

- The edge function runs a SQL query comparing the two most recent effective dates with >1000 records (to skip partial mid-week updates)
- Filters out drugs where the old price was 0 to avoid division-by-zero / infinite % changes
- Returns both the raw price change and percentage change
- No new database tables needed — this reads from the existing `nadac_drugs` table
