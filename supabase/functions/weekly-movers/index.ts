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

    // Get the two most recent distinct effective dates
    const { data: dates, error: datesErr } = await supabase
      .from('nadac_drugs')
      .select('effective_date')
      .order('effective_date', { ascending: false });

    if (datesErr) throw new Error(`Dates error: ${datesErr.message}`);

    // Deduplicate dates
    const uniqueDates = [...new Set((dates || []).map(d => d.effective_date))];

    if (uniqueDates.length < 2) {
      return new Response(JSON.stringify({ success: false, error: 'Not enough weekly data to compare' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const currentDate = uniqueDates[0];
    const previousDate = uniqueDates[1];

    console.log(`Comparing ${currentDate} vs ${previousDate}`);

    // For each date, get the latest price per NDC as of that date.
    // We need the most recent record per NDC where effective_date <= target date.
    // Use a DB function approach: fetch all records up to each date, keep latest per NDC.

    async function fetchLatestPricesAsOf(asOfDate: string) {
      const priceMap = new Map<string, { drugName: string; price: number; pricingUnit: string }>();
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await supabase
          .from('nadac_drugs')
          .select('ndc, drug_name, nadac_per_unit, pricing_unit, effective_date')
          .lte('effective_date', asOfDate)
          .order('effective_date', { ascending: false })
          .range(from, from + pageSize - 1);
        if (error) throw new Error(`Fetch error: ${error.message}`);
        if (!data || data.length === 0) break;
        for (const row of data) {
          // Keep only the first (most recent) entry per NDC
          if (!priceMap.has(row.ndc)) {
            priceMap.set(row.ndc, {
              drugName: row.drug_name,
              price: row.nadac_per_unit,
              pricingUnit: row.pricing_unit || 'EA',
            });
          }
        }
        if (data.length < pageSize) break;
        from += pageSize;
      }
      return priceMap;
    }

    const currentPrices = await fetchLatestPricesAsOf(currentDate);
    const previousPrices = await fetchLatestPricesAsOf(previousDate);

    interface Mover {
      ndc: string;
      drugName: string;
      oldPrice: number;
      newPrice: number;
      pctChange: number;
      pricingUnit: string;
    }

    const movers: Mover[] = [];

    for (const [ndc, current] of currentPrices) {
      const prev = previousPrices.get(ndc);
      if (!prev || prev.price === 0 || prev.price === current.price) continue;

      const pctChange = ((current.price - prev.price) / prev.price) * 100;
      movers.push({
        ndc,
        drugName: current.drugName,
        oldPrice: prev.price,
        newPrice: current.price,
        pctChange: Math.round(pctChange * 100) / 100,
        pricingUnit: current.pricingUnit,
      });
    }

    // Deduplicate by drug name (keep largest absolute change)
    const deduped = new Map<string, Mover>();
    for (const m of movers) {
      const existing = deduped.get(m.drugName);
      if (!existing || Math.abs(m.pctChange) > Math.abs(existing.pctChange)) {
        deduped.set(m.drugName, m);
      }
    }
    const uniqueMovers = Array.from(deduped.values());

    const topIncreases = [...uniqueMovers].sort((a, b) => b.pctChange - a.pctChange).slice(0, 5);
    const topDecreases = [...uniqueMovers].sort((a, b) => a.pctChange - b.pctChange).slice(0, 5);

    // Upsert into weekly_movers table
    const { error: upsertError } = await supabase
      .from('weekly_movers')
      .upsert({
        effective_date: currentDate,
        previous_date: previousDate,
        top_increases: topIncreases,
        top_decreases: topDecreases,
        total_changed: movers.length,
      }, { onConflict: 'effective_date' });

    if (upsertError) {
      console.error('Upsert error:', upsertError);
      throw new Error(`Failed to save movers: ${upsertError.message}`);
    }

    console.log(`Saved movers for ${currentDate}: ${topIncreases.length} increases, ${topDecreases.length} decreases, ${movers.length} total changed`);

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
