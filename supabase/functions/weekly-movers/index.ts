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

    // Find the two most recent effective dates that have meaningful data (50+ records)
    // These represent actual CMS weekly releases
    const { data: dateCounts, error: dcErr } = await supabase
      .rpc('get_effective_date_counts');

    // Fallback: just query distinct dates with counts manually
    // Since we can't use rpc, paginate through dates
    const significantDates: string[] = [];
    let searchBefore: string | null = null;

    for (let attempt = 0; attempt < 30 && significantDates.length < 2; attempt++) {
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

      if (count && count >= 50) {
        significantDates.push(row.effective_date);
      }

      searchBefore = row.effective_date;
    }

    if (significantDates.length < 2) {
      return new Response(JSON.stringify({ success: false, error: 'Not enough weekly data to compare' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const currentDate = significantDates[0];
    const previousDate = significantDates[1];

    console.log(`Comparing ${currentDate} vs ${previousDate}`);

    // Fetch the latest price per NDC as of a given date
    // We paginate through all records with effective_date <= asOfDate,
    // ordered by effective_date desc, keeping only the first (newest) per NDC
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

    console.log(`Saved movers for ${currentDate}: ${topIncreases.length} up, ${topDecreases.length} down, ${movers.length} total`);

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
