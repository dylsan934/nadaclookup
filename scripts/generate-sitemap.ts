// Runs before `vite dev` and `vite build` (predev/prebuild hooks).
// Writes:
//   - public/sitemap.xml             — sitemap index
//   - public/sitemap-drugs-N.xml     — one per 5,000 drug pages
// public/sitemap-static.xml is kept as a hand-edited file (not regenerated).

import { writeFileSync, readdirSync, unlinkSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://nadaclookup.com";
const PAGE_SIZE = 5000;
const PUBLIC_DIR = resolve("public");

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://wcbzqrskgfszkwgrzogo.supabase.co";
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjYnpxcnNrZ2Zzemt3Z3J6b2dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNjM5MjQsImV4cCI6MjA4MjYzOTkyNH0.1HEIbY0YJa-IA3GamPFJ42uT6VgdkUw3DZOBC1aRmP8";

const slugify = (name: string): string => {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base}-nadac-price`;
};

const escapeXml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

async function fetchAllDrugs(): Promise<Map<string, string>> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });

  // Page through all rows and dedupe by drug_name, keeping latest effective_date.
  const drugs = new Map<string, string>(); // name -> lastmod
  const CHUNK = 1000;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("nadac_drugs")
      .select("drug_name, effective_date")
      .order("drug_name", { ascending: true })
      .range(offset, offset + CHUNK - 1);

    if (error) throw new Error(`Supabase fetch failed: ${error.message}`);
    if (!data || data.length === 0) break;

    for (const row of data) {
      const existing = drugs.get(row.drug_name);
      if (!existing || row.effective_date > existing) {
        drugs.set(row.drug_name, row.effective_date);
      }
    }

    if (data.length < CHUNK) break;
    offset += CHUNK;
  }

  return drugs;
}

function buildUrlset(entries: Array<[string, string]>): string {
  const urls = entries
    .map(([name, lastmod]) => {
      const loc = `${BASE_URL}/drug/${slugify(name)}`;
      return `  <url><loc>${escapeXml(loc)}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function buildIndex(drugSitemapCount: number): string {
  const today = new Date().toISOString().slice(0, 10);
  const sitemaps: string[] = [
    `  <sitemap><loc>${BASE_URL}/sitemap-static.xml</loc><lastmod>${today}</lastmod></sitemap>`,
  ];
  for (let i = 1; i <= drugSitemapCount; i++) {
    sitemaps.push(
      `  <sitemap><loc>${BASE_URL}/sitemap-drugs-${i}.xml</loc><lastmod>${today}</lastmod></sitemap>`,
    );
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemaps.join("\n")}\n</sitemapindex>\n`;
}

function cleanupOldDrugSitemaps() {
  for (const file of readdirSync(PUBLIC_DIR)) {
    if (/^sitemap-drugs-\d+\.xml$/.test(file)) {
      unlinkSync(resolve(PUBLIC_DIR, file));
    }
  }
}

async function main() {
  console.log("Generating sitemap…");

  let drugs: Map<string, string>;
  try {
    drugs = await fetchAllDrugs();
  } catch (err) {
    console.warn(
      `[generate-sitemap] Could not fetch drugs (${(err as Error).message}). Writing minimal index.`,
    );
    cleanupOldDrugSitemaps();
    writeFileSync(resolve(PUBLIC_DIR, "sitemap.xml"), buildIndex(0));
    return;
  }

  const entries = Array.from(drugs.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  console.log(`  Found ${entries.length} distinct drugs.`);

  cleanupOldDrugSitemaps();

  let fileIndex = 0;
  for (let i = 0; i < entries.length; i += PAGE_SIZE) {
    fileIndex += 1;
    const chunk = entries.slice(i, i + PAGE_SIZE);
    const xml = buildUrlset(chunk);
    writeFileSync(resolve(PUBLIC_DIR, `sitemap-drugs-${fileIndex}.xml`), xml);
    console.log(`  Wrote sitemap-drugs-${fileIndex}.xml (${chunk.length} URLs)`);
  }

  writeFileSync(resolve(PUBLIC_DIR, "sitemap.xml"), buildIndex(fileIndex));
  console.log(
    `  Wrote sitemap.xml index referencing sitemap-static.xml + ${fileIndex} drug sitemap(s).`,
  );
}

main().catch((err) => {
  console.error("[generate-sitemap] Fatal error:", err);
  process.exit(1);
});
