import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find the two most recent bulk effective dates
    // Strategy: get latest date, check count, then walk backwards
    const bulkDates: string[] = [];
    let searchBefore: string | null = null;

    for (let attempt = 0; attempt < 20 && bulkDates.length < 2; attempt++) {
      let query = supabase
        .from('nadac_drugs')
        .select('effective_date')
        .order('effective_date', { ascending: false })
        .limit(1);

      if (searchBefore) {
        query = query.lt('effective_date', searchBefore);
      }

      const { data: row } = await query.single();
      if (!row) break;

      const { count } = await supabase
        .from('nadac_drugs')
        .select('*', { count: 'exact', head: true })
        .eq('effective_date', row.effective_date);

      if (count && count > 1000) {
        bulkDates.push(row.effective_date);
      }

      searchBefore = row.effective_date;
    }

    if (bulkDates.length < 2) {
      return new Response(JSON.stringify({ success: false, error: 'Not enough weekly data to compare' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const currentDate = bulkDates[0];
    const previousDate = bulkDates[1];

    console.log(`Comparing ${currentDate} vs ${previousDate}`);

    // Helper to fetch all rows for a date (paginated past 1000 limit)
    async function fetchAllForDate(date: string, columns: string) {
      const allRows: any[] = [];
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await supabase
          .from('nadac_drugs')
          .select(columns)
          .eq('effective_date', date)
          .range(from, from + pageSize - 1);
        if (error) throw new Error(`Fetch error: ${error.message}`);
        if (!data || data.length === 0) break;
        allRows.push(...data);
        if (data.length < pageSize) break;
        from += pageSize;
      }
      return allRows;
    }

    // Fetch current and previous week prices
    const currentData = await fetchAllForDate(currentDate, 'ndc, drug_name, nadac_per_unit, pricing_unit');
    const prevData = await fetchAllForDate(previousDate, 'ndc, nadac_per_unit');

    // Build lookup map for previous prices
    const prevMap = new Map<string, number>();
    for (const d of prevData) {
      prevMap.set(d.ndc, d.nadac_per_unit);
    }

    // Calculate changes
    interface Mover {
      ndc: string;
      drugName: string;
      oldPrice: number;
      newPrice: number;
      pctChange: number;
      pricingUnit: string;
    }

    const movers: Mover[] = [];

    for (const drug of currentData) {
      const oldPrice = prevMap.get(drug.ndc);
      if (oldPrice === undefined || oldPrice === 0 || oldPrice === drug.nadac_per_unit) continue;

      const pctChange = ((drug.nadac_per_unit - oldPrice) / oldPrice) * 100;

      movers.push({
        ndc: drug.ndc,
        drugName: drug.drug_name,
        oldPrice,
        newPrice: drug.nadac_per_unit,
        pctChange: Math.round(pctChange * 100) / 100,
        pricingUnit: drug.pricing_unit || 'EA',
      });
    }

    // Sort for top increases and decreases
    const sorted = [...movers].sort((a, b) => b.pctChange - a.pctChange);
    const topIncreases = sorted.slice(0, 10);
    const topDecreases = [...movers].sort((a, b) => a.pctChange - b.pctChange).slice(0, 10);

    return new Response(JSON.stringify({
      success: true,
      currentDate,
      previousDate,
      topIncreases,
      topDecreases,
      totalChanged: movers.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Weekly movers error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
