import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireServiceRole } from "../_shared/require-service-role.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authError = requireServiceRole(req, corsHeaders);
  if (authError) return authError;


  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    interface Mover {
      ndc: string;
      drugName: string;
      oldPrice: number;
      newPrice: number;
      pctChange: number;
      pricingUnit: string;
    }

    // CMS publishes both full weekly snapshots and small incremental corrections. Rather than
    // discarding small files, compare every NDC in the newest published file against that same
    // NDC's own previous published price. The DB function does this with DISTINCT ON.
    const { data: rpcRows, error: rpcError } = await supabase.rpc('compute_weekly_movers');

    if (rpcError) {
      throw new Error(`compute_weekly_movers failed: ${rpcError.message}`);
    }

    const rows = (rpcRows || []) as Array<{
      cur_date: string;
      prev_date: string;
      ndc: string;
      drug_name: string;
      old_price: number;
      new_price: number;
      pct_change: number;
      pricing_unit: string;
    }>;

    if (rows.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No price changes found between the latest published data and the previous prices',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const currentDate = rows[0].cur_date;
    const previousDate = rows[0].prev_date;

    console.log(`Comparing latest published data ${currentDate} against prior prices (through ${previousDate})`);

    const movers: Mover[] = rows.map((r) => ({
      ndc: r.ndc,
      drugName: r.drug_name,
      oldPrice: Number(r.old_price),
      newPrice: Number(r.new_price),
      pctChange: Number(r.pct_change),
      pricingUnit: r.pricing_unit || 'EA',
    }));

    // Deduplicate by drug name (keep largest absolute change)
    const deduped = new Map<string, Mover>();
    for (const m of movers) {
      const existing = deduped.get(m.drugName);
      if (!existing || Math.abs(m.pctChange) > Math.abs(existing.pctChange)) {
        deduped.set(m.drugName, m);
      }
    }
    const uniqueMovers = Array.from(deduped.values());

    const topIncreases = uniqueMovers.filter((m) => m.pctChange > 0).sort((a, b) => b.pctChange - a.pctChange).slice(0, 10);
    const topDecreases = uniqueMovers.filter((m) => m.pctChange < 0).sort((a, b) => a.pctChange - b.pctChange).slice(0, 10);

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
