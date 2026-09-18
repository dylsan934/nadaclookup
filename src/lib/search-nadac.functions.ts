/**
 * Server function port of the `search-nadac` Supabase edge function.
 * Searches nadac_drugs by drug name or NDC and collapses history rows to the
 * latest record per NDC + pricing category.
 */
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const InputSchema = z.object({
  searchTerm: z.string().min(1),
  limit: z.number().int().positive().max(500).optional(),
});

type NadacDrugRow = Database["public"]["Tables"]["nadac_drugs"]["Row"];

export interface SearchNadacResult {
  success: boolean;
  data?: NadacDrugRow[];
  total?: number;
  error?: string;
}

function getSupabase() {
  const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
  const key =
    process.env["SUPABASE_ANON_KEY"] ??
    process.env["SUPABASE_PUBLISHABLE_KEY"] ??
    process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Supabase environment not configured");
  return createClient<Database>(url, key);
}

export const searchNadac = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data: input }): Promise<SearchNadacResult> => {
    try {
      const supabase = getSupabase();
      // Some CMS rows arrived with stray surrounding quotes; clean the boundary.
      const unquote = (v: string) => v.replace(/^"+|"+$/g, "").trim();
      const term = unquote(input.searchTerm.trim());
      const limit = input.limit ?? 50;
      if (!term) return { success: false, error: "Search term is required" };

      // Normalize NDC: remove dashes and leading zeros for flexible matching
      const normalizeNDC = (ndc: string) => ndc.replace(/[-]/g, "").replace(/^0+/, "");
      const isNDC = /^[\d-]+$/.test(term);

      // The table keeps one row per NDC per effective date (history). Over-fetch so
      // that after collapsing to the latest record per NDC + pricing category we can
      // still return `limit` drugs.
      const fetchLimit = Math.min(Math.max(limit, 1) * 12, 2000);

      const query = isNDC
        ? supabase
            .from("nadac_drugs")
            .select("*")
            .or(`ndc.ilike.%${term}%,ndc.ilike.%${normalizeNDC(term)}%`)
            .order("effective_date", { ascending: false })
            .limit(fetchLimit)
        : supabase
            .from("nadac_drugs")
            .select("*")
            .ilike("drug_name", `%${term}%`)
            .order("effective_date", { ascending: false })
            .limit(fetchLimit);

      const { data, error } = await query;
      if (error) {
        console.error("Database query error:", error);
        return { success: false, error: "Failed to search database" };
      }

      // Collapse to the current record per NDC + pricing category (latest
      // effective_date). Historical rows stay in the database for price history but
      // must not appear as current prices.
      const uniqueDrugs = new Map<string, NadacDrugRow>();
      for (const drug of data ?? []) {
        const key = `${drug.ndc}|${drug.pharmacy_type ?? ""}`;
        const existing = uniqueDrugs.get(key);
        if (!existing || (drug.effective_date ?? "") > (existing.effective_date ?? "")) {
          uniqueDrugs.set(key, drug);
        }
      }

      const cleaned = Array.from(uniqueDrugs.values()).map((d) => ({
        ...d,
        ndc: unquote(String(d.ndc)),
        drug_name: unquote(String(d.drug_name)),
      }));

      const results = cleaned
        .sort((a, b) =>
          a.effective_date === b.effective_date
            ? String(a.ndc).localeCompare(String(b.ndc))
            : String(b.effective_date ?? "").localeCompare(String(a.effective_date ?? "")),
        )
        .slice(0, limit);

      return { success: true, data: results, total: results.length };
    } catch (error) {
      console.error("Search error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  });
