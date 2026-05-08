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

    // Find the two most recent bulk effective dates using raw SQL via postgrest
    // We need to use the service role key to query directly
    const dbUrl = Deno.env.get('SUPABASE_DB_URL')!;
    
    // Use fetch against the REST API with an RPC-like approach
    // First, get distinct dates with counts > 1000
    const dateRes = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    }).catch(() => null);

    // Use a simpler approach: query distinct effective_dates ordered desc
    // and check counts by fetching with head:true for each
    const { data: distinctDates, error: ddErr } = await supabase
      .from('nadac_drugs')
      .select('effective_date')
      .order('effective_date', { ascending: false })
      .limit(1000);

    if (ddErr || !distinctDates) throw new Error('Could not fetch dates');

    // Count occurrences
    const dateCounts = new Map<string, number>();
    for (const r of distinctDates) {
      dateCounts.set(r.effective_date, (dateCounts.get(r.effective_date) || 0) + 1);
    }

    // The limit of 1000 means we can't count properly. Instead, get unique dates and check counts via head requests
    const uniqueDates = [...new Set(distinctDates.map(r => r.effective_date))].sort().reverse();
    
    const bulkDates: string[] = [];
    for (const date of uniqueDates) {
      if (bulkDates.length >= 2) break;
      const { count, error: cErr } = await supabase
        .from('nadac_drugs')
        .select('*', { count: 'exact', head: true })
        .eq('effective_date', date);
      
      if (!cErr && count && count > 1000) {
        bulkDates.push(date);
      }
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

    // Fetch current week prices
    const currentData = await fetchAllForDate(currentDate, 'ndc, drug_name, nadac_per_unit, pricing_unit');

    // Fetch previous week prices
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
    const topDecreases = sorted.reverse().slice(0, 10);

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
