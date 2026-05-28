## The fix

Right now `/sitemap.xml` only points at `/sitemap-static.xml` (16 URLs). The 6,227 drug pages live behind an edge function (`sitemap-drugs`) that Google has never been told about. Result: **0 drug pages discovered, 0 indexed**.

The cleanest fix is to generate the drug sitemaps as **static files at build time** and list them in the sitemap index. This avoids cross-host sitemap issues (Supabase functions live on `*.supabase.co`, not `nadaclookup.com`) and means Google sees fast, plain XML at well-known paths.

## Changes

**1. New build script: `scripts/generate-sitemap.ts`**
- Connects to Supabase using the project anon key (read-only)
- Pulls all distinct `drug_name` values from `nadac_drugs` (with their latest `effective_date`)
- Writes one or more files in 5,000-URL chunks:
  - `public/sitemap-drugs-1.xml`
  - `public/sitemap-drugs-2.xml` (etc., as the catalog grows)
- Writes/overwrites `public/sitemap.xml` as a sitemap index referencing `sitemap-static.xml` + every `sitemap-drugs-N.xml`

**2. `package.json`**
- Add `"predev"` and `"prebuild"` scripts: `bunx tsx scripts/generate-sitemap.ts`
- So the sitemap regenerates locally and on every publish (catches new drugs automatically)

**3. `public/robots.txt`**
- Add `Sitemap: https://nadaclookup.com/sitemap.xml` directive (helps every crawler, not just Googlebot)

**4. Existing pieces left alone**
- `public/sitemap-static.xml` — kept as-is, just referenced from the new index
- `supabase/functions/sitemap-drugs` edge function — left in place as a backup/programmatic option; not referenced by `sitemap.xml` anymore. We can delete it later if you'd like.

## After deploying

The Search Console resubmit takes ~24–72h for the first crawl, then indexing rolls out over 2–8 weeks. I won't be able to manually request indexing for 6,227 URLs (Google's URL Inspection API caps at a handful per day), but the sitemap submission is the right mechanism for bulk discovery.

You'll see progress here:
- Search Console → Sitemaps: "Discovered URLs" should climb from 16 toward 6,200+ within a week
- Search Console → Pages: indexed count starts growing within 2–4 weeks

## Out of scope (flag for later)

- Indexing API integration (only allowed for job-posting / livestream content — not drug pages, would violate Google's terms)
- Fixing the unrelated "0 of 16 static pages indexed" oddity — worth a separate look after the bulk fix is live
- Backlink building (the bigger lever, but a different workstream)

Ready to switch to build mode and ship this?
