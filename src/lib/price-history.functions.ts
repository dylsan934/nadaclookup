/**
 * Server function port of the `get-price-history` Supabase edge function.
 * Fetches historical NADAC prices for an NDC from the public CMS Medicaid
 * datastore (no secrets required).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Dataset IDs for NADAC yearly data from CMS Medicaid
const DATASET_IDS: Record<number, string> = {
  2026: "fbb83258-11c7-47f5-8b18-5f8e79f7e704",
  2025: "eaa3b6ec-df4d-4c20-8372-0956e2874a5c",
  2024: "2adff818-dba7-48e2-92d6-8bb29b6e6699",
  2023: "ab1d2c97-2a98-422c-a73e-6990b3ad5fd4",
  2022: "dfa2ab14-06c2-457a-9e36-5cb6d80f8d93",
  2021: "d5eaf378-dcef-5779-83de-acdd8347d68e",
};

interface PriceHistoryPoint {
  date: string;
  price: number;
  pricingUnit: string;
}

interface CMSRecord {
  ndc: string;
  ndc_description: string;
  nadac_per_unit: string;
  effective_date: string;
  pricing_unit: string;
}

const InputSchema = z.object({
  ndc: z.string().min(1),
  years: z.number().int().positive().max(10).optional(),
});

async function fetchYearData(datasetId: string, ndc: string): Promise<PriceHistoryPoint[]> {
  const cleanNdc = ndc.replace(/-/g, "");

  // Try multiple NDC formats
  const ndcFormats = [
    ndc,
    cleanNdc,
    // Standard 11-digit with dashes: 5-4-2 format
    `${cleanNdc.slice(0, 5)}-${cleanNdc.slice(5, 9)}-${cleanNdc.slice(9, 11)}`,
  ];

  for (const ndcFormat of ndcFormats) {
    try {
      const url = new URL(`https://data.medicaid.gov/api/1/datastore/query/${datasetId}/0`);
      url.searchParams.set("conditions[0][property]", "ndc");
      url.searchParams.set("conditions[0][value]", ndcFormat);
      url.searchParams.set("conditions[0][operator]", "=");
      url.searchParams.set("limit", "500");
      url.searchParams.set("offset", "0");

      const response = await fetch(url.toString(), { headers: { Accept: "application/json" } });
      if (!response.ok) {
        console.log(`Failed to fetch for NDC format ${ndcFormat}: ${response.status}`);
        continue;
      }

      const data = (await response.json()) as { results?: CMSRecord[] };
      const results = data.results ?? [];
      if (results.length > 0) {
        return results.map((record) => ({
          date: record.effective_date,
          price: parseFloat(record.nadac_per_unit) || 0,
          pricingUnit: record.pricing_unit || "EA",
        }));
      }
    } catch (error) {
      console.error(`Error fetching data for NDC ${ndcFormat}:`, error);
    }
  }

  return [];
}

export const getPriceHistory = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data: input }) => {
    try {
      const { ndc } = input;
      const years = input.years ?? 2;

      const currentYear = new Date().getFullYear();
      const startYear = Math.max(currentYear - years + 1, 2021); // Data from 2021 onwards

      const allHistory: PriceHistoryPoint[] = [];
      for (let year = currentYear; year >= startYear; year--) {
        const datasetId = DATASET_IDS[year];
        if (datasetId) {
          const yearData = await fetchYearData(datasetId, ndc);
          allHistory.push(...yearData);
        }
      }

      // Sort by date ascending
      allHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const prices = allHistory.map((p) => p.price).filter((p) => p > 0);
      const first = prices[0];
      const last = prices[prices.length - 1];
      const stats = {
        currentPrice: last ?? 0,
        highestPrice: prices.length > 0 ? Math.max(...prices) : 0,
        lowestPrice: prices.length > 0 ? Math.min(...prices) : 0,
        percentChange:
          prices.length >= 2 && first !== undefined && last !== undefined && first !== 0
            ? ((last - first) / first) * 100
            : 0,
        dataPoints: allHistory.length,
      };

      return { success: true as const, ndc, history: allHistory, stats };
    } catch (error) {
      console.error("Price history error:", error);
      return {
        success: false as const,
        ndc: input.ndc,
        history: [] as PriceHistoryPoint[],
        stats: { currentPrice: 0, highestPrice: 0, lowestPrice: 0, percentChange: 0, dataPoints: 0 },
        error: error instanceof Error ? error.message : "Failed to fetch price history",
      };
    }
  });
