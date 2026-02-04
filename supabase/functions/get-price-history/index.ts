import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Dataset IDs for NADAC yearly data from CMS Medicaid
const DATASET_IDS: Record<number, string> = {
  2026: 'fbb83258-11c7-47f5-8b18-5f8e79f7e704',
  2025: 'eaa3b6ec-df4d-4c20-8372-0956e2874a5c',
  2024: '2adff818-dba7-48e2-92d6-8bb29b6e6699',
  2023: 'ab1d2c97-2a98-422c-a73e-6990b3ad5fd4',
  2022: '6e7e6b9e-a8d5-4a4e-9f6a-4c0a5b9c8d7e',
  2021: '5d6e7f8a-b9c0-4a1b-8c2d-3e4f5a6b7c8d',
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
  pharmacy_type_indicator?: string;
  otc?: string;
  explanation_code?: string;
  classification_for_rate_setting?: string;
  corresponding_generic_drug_nadac_per_unit?: string;
  corresponding_generic_drug_effective_date?: string;
  as_of_date?: string;
}

async function fetchYearData(datasetId: string, ndc: string): Promise<PriceHistoryPoint[]> {
  const cleanNdc = ndc.replace(/-/g, '');
  
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
      url.searchParams.set('conditions[0][property]', 'ndc');
      url.searchParams.set('conditions[0][value]', ndcFormat);
      url.searchParams.set('conditions[0][operator]', '=');
      url.searchParams.set('limit', '500');
      url.searchParams.set('offset', '0');

      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        console.log(`Failed to fetch for NDC format ${ndcFormat}: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const results = data.results || [];
      
      if (results.length > 0) {
        return results.map((record: CMSRecord) => ({
          date: record.effective_date,
          price: parseFloat(record.nadac_per_unit) || 0,
          pricingUnit: record.pricing_unit || 'EA',
        }));
      }
    } catch (error) {
      console.error(`Error fetching data for NDC ${ndcFormat}:`, error);
    }
  }

  return [];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ndc, years = 2 } = await req.json();

    if (!ndc) {
      return new Response(
        JSON.stringify({ success: false, error: 'NDC is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching price history for NDC: ${ndc}, years: ${years}`);

    const currentYear = new Date().getFullYear();
    const startYear = Math.max(currentYear - years + 1, 2021); // We have data from 2021 onwards
    
    const allHistory: PriceHistoryPoint[] = [];
    
    // Fetch data from each year's dataset
    for (let year = currentYear; year >= startYear; year--) {
      const datasetId = DATASET_IDS[year];
      if (datasetId) {
        console.log(`Fetching year ${year} data from dataset ${datasetId}`);
        const yearData = await fetchYearData(datasetId, ndc);
        console.log(`Found ${yearData.length} records for year ${year}`);
        allHistory.push(...yearData);
      }
    }

    // Sort by date ascending
    allHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate stats
    const prices = allHistory.map(p => p.price).filter(p => p > 0);
    const stats = {
      currentPrice: prices.length > 0 ? prices[prices.length - 1] : 0,
      highestPrice: prices.length > 0 ? Math.max(...prices) : 0,
      lowestPrice: prices.length > 0 ? Math.min(...prices) : 0,
      percentChange: prices.length >= 2 
        ? ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100 
        : 0,
      dataPoints: allHistory.length,
    };

    return new Response(
      JSON.stringify({
        success: true,
        ndc,
        history: allHistory,
        stats,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Price history error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch price history' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
