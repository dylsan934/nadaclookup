// Public sitemap for dynamic drug pages.
// Paginates distinct drug names; ?page=N returns up to PAGE_SIZE URLs.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const PAGE_SIZE = 5000;
const SITE = "https://nadaclookup.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const xmlHeaders = {
  ...corsHeaders,
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=86400, s-maxage=86400",
};

const slugify = (name: string): string => {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base}-nadac-price`;
};

const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const offset = (page - 1) * PAGE_SIZE;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch a page of rows ordered by drug_name; dedupe in-memory to PAGE_SIZE distinct names.
    // Pull a generous slice (PAGE_SIZE * 25) to absorb duplicate NDCs per drug.
    const fetchLimit = PAGE_SIZE * 25;
    const { data, error } = await supabase
      .from("nadac_drugs")
      .select("drug_name, effective_date")
      .order("drug_name", { ascending: true })
      .range(offset * 25, offset * 25 + fetchLimit - 1);

    if (error) throw error;

    const seen = new Map<string, string>(); // name -> latest effective_date
    for (const row of data || []) {
      const existing = seen.get(row.drug_name);
      if (!existing || row.effective_date > existing) {
        seen.set(row.drug_name, row.effective_date);
      }
      if (seen.size >= PAGE_SIZE) break;
    }

    const urls = Array.from(seen.entries())
      .map(([name, lastmod]) => {
        const loc = `${SITE}/drug/${slugify(name)}`;
        return `  <url><loc>${escapeXml(loc)}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>`;
      })
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    return new Response(xml, { headers: xmlHeaders, status: 200 });
  } catch (e) {
    console.error("sitemap-drugs error", e);
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`, {
      headers: xmlHeaders,
      status: 200,
    });
  }
});
