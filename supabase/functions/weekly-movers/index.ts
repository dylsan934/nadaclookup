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

    // Find the two most recent "full" effective dates (>1000 records each)
    const { data: dates, error: datesErr } = await supabase.rpc('get_recent_bulk_dates');

    // Fallback: query directly if RPC doesn't exist
    let currentDate: string;
    let previousDate: string;

    if (datesErr || !dates || dates.length < 2) {
      // Direct query fallback
      const { data: rawDates, error: rawErr } = await supabase
        .from('nadac_drugs')
        .select('effective_date')
        .order('effective_date', { ascending: false });

      if (rawErr || !rawDates) {
        throw new Error('Could not fetch effective dates');
      }

      // Count per date to find bulk dates
      const dateCounts = new Map<string, number>();
      for (const r of rawDates) {
        dateCounts.set(r.effective_date, (dateCounts.get(r.effective_date) || 0) + 1);
      }

      const bulkDates = Array.from(dateCounts.entries())
        .filter(([_, count]) => count > 1000)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([date]) => date);

      if (bulkDates.length < 2) {
        return new Response(JSON.stringify({ success: false, error: 'Not enough weekly data to compare' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      currentDate = bulkDates[0];
      previousDate = bulkDates[1];
    } else {
      currentDate = dates[0].effective_date;
      previousDate = dates[1].effective_date;
    }

    console.log(`Comparing ${currentDate} vs ${previousDate}`);

    // Fetch current week prices
    const { data: currentData, error: currErr } = await supabase
      .from('nadac_drugs')
      .select('ndc, drug_name, nadac_per_unit, pricing_unit')
      .eq('effective_date', currentDate);

    if (currErr || !currentData) throw new Error('Failed to fetch current data');

    // Fetch previous week prices
    const { data: prevData, error: prevErr } = await supabase
      .from('nadac_drugs')
      .select('ndc, nadac_per_unit')
      .eq('effective_date', previousDate);

    if (prevErr || !prevData) throw new Error('Failed to fetch previous data');

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
