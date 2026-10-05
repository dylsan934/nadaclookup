import { supabase } from "@/integrations/supabase/client";
import { drugNameRoot, drugNameToSlug, slugToSearchTerm } from "@/lib/drug-slug";

export interface RelatedDrugLink {
  drug_name: string;
  nadac_per_unit: number;
  pricing_unit: string | null;
  effective_date: string;
}

/**
 * Pick the row whose name slugifies to exactly this slug. The wildcard ilike pattern
 * from slugToSearchTerm also matches near-names ("abilify%5%mg" matches "ABILIFY 15 MG"),
 * which previously gave different URLs the same drug and the same title.
 */
export function pickExactSlugMatch<T extends { drug_name: string }>(rows: T[], slug: string): T[] {
  const exact = rows.filter((r) => drugNameToSlug(r.drug_name) === slug);
  return exact.length > 0 ? exact : rows;
}

export async function resolveDrugNameForSlug(slug: string): Promise<{ drug_name: string; ndc: string } | null> {
  const term = slugToSearchTerm(slug);
  const { data } = await supabase
    .from("nadac_drugs")
    .select("drug_name, ndc, effective_date")
    .ilike("drug_name", term)
    .order("effective_date", { ascending: false })
    .limit(500);
  let rows = data ?? [];
  if (rows.length === 0) {
    const loose = await supabase
      .from("nadac_drugs")
      .select("drug_name, ndc, effective_date")
      .ilike("drug_name", `${term}%`)
      .order("effective_date", { ascending: false })
      .limit(500);
    rows = loose.data ?? [];
  }
  const row = pickExactSlugMatch(rows, slug)[0];
  return row ? { drug_name: row.drug_name, ndc: row.ndc } : null;
}

function dedupe(rows: RelatedDrugLink[], exclude: Set<string>, max: number): RelatedDrugLink[] {
  const out: RelatedDrugLink[] = [];
  for (const r of rows) {
    const key = r.drug_name.toUpperCase();
    if (exclude.has(key)) continue;
    exclude.add(key);
    out.push(r);
    if (out.length >= max) break;
  }
  return out;
}

/**
 * Related drug links rendered server-side on every drug page: same-ingredient products
 * first, then alphabetical neighbours. The neighbours guarantee every drug page is linked
 * from at least one other drug page, so no page is reachable only via the sitemap.
 */
export async function fetchRelatedDrugs(drugName: string): Promise<RelatedDrugLink[]> {
  const cols = "drug_name, nadac_per_unit, pricing_unit, effective_date";
  const seen = new Set<string>([drugName.toUpperCase()]);
  const root = drugNameRoot(drugName);

  const [sameRoot, after, before] = await Promise.all([
    root
      ? supabase.from("nadac_drugs").select(cols).ilike("drug_name", `${root}%`).order("effective_date", { ascending: false }).limit(200)
      : Promise.resolve({ data: [] as RelatedDrugLink[] }),
    supabase.from("nadac_drugs").select(cols).gt("drug_name", drugName).order("drug_name", { ascending: true }).limit(80),
    supabase.from("nadac_drugs").select(cols).lt("drug_name", drugName).order("drug_name", { ascending: false }).limit(80),
  ]);

  const similar = dedupe((sameRoot.data ?? []) as RelatedDrugLink[], seen, 5);
  const next = dedupe((after.data ?? []) as RelatedDrugLink[], seen, 2);
  const prev = dedupe((before.data ?? []) as RelatedDrugLink[], seen, 1);
  return [...similar, ...prev, ...next];
}
