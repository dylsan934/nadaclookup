import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchTerm, limit = 50 } = await req.json();

    if (!searchTerm || searchTerm.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Search term is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Searching for: "${searchTerm}"`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const term = searchTerm.trim();
    
    // Normalize NDC: remove dashes and leading zeros for flexible matching
    const normalizeNDC = (ndc: string) => ndc.replace(/[-]/g, '').replace(/^0+/, '');
    
    // Determine if searching by NDC or drug name
    // NDC can be digits only or digits with dashes
    const isNDC = /^[\d-]+$/.test(term);

    // The table keeps one row per NDC per effective date (history). Over-fetch so that after
    // collapsing to the latest record per NDC + pricing category we can still return `limit` drugs.
    const fetchLimit = Math.min(Math.max(limit, 1) * 12, 2000);

    let query;
    
    if (isNDC) {
      // Normalize the search term for NDC matching
      const normalizedTerm = normalizeNDC(term);
      console.log(`NDC search - original: "${term}", normalized: "${normalizedTerm}"`);
      
      // First try exact match with the original term
      // Then we'll also search using a pattern that accounts for missing dashes/zeros
      query = supabase
        .from('nadac_drugs')
        .select('*')
        .or(`ndc.ilike.%${term}%,ndc.ilike.%${normalizedTerm}%`)
        .order('effective_date', { ascending: false })
        .limit(fetchLimit);
    } else {
      // Search by drug name using case-insensitive pattern matching
      query = supabase
        .from('nadac_drugs')
        .select('*')
        .ilike('drug_name', `%${term}%`)
        .order('effective_date', { ascending: false })
        .limit(fetchLimit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database query error:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to search database' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${data?.length || 0} results`);

    // Collapse to the current record per NDC + pricing category (latest effective_date).
    // Historical rows stay in the database for price history but must not appear as current prices.
    const uniqueDrugs = new Map<string, any>();
    for (const drug of data || []) {
      const key = `${drug.ndc}|${drug.pharmacy_type ?? ''}`;
      const existing = uniqueDrugs.get(key);
      if (!existing || drug.effective_date > existing.effective_date) {
        uniqueDrugs.set(key, drug);
      }
    }

    const results = Array.from(uniqueDrugs.values())
      .sort((a, b) =>
        a.effective_date === b.effective_date
          ? String(a.ndc).localeCompare(String(b.ndc))
          : String(b.effective_date).localeCompare(String(a.effective_date))
      )
      .slice(0, limit);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: results,
        total: results.length 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Search error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
