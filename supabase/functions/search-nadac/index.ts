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
        .limit(limit);
    } else {
      // Search by drug name using case-insensitive pattern matching
      query = supabase
        .from('nadac_drugs')
        .select('*')
        .ilike('drug_name', `%${term}%`)
        .order('effective_date', { ascending: false })
        .limit(limit);
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

    // Get unique drugs by NDC, keeping only the most recent price for each
    const uniqueDrugs = new Map();
    for (const drug of data || []) {
      if (!uniqueDrugs.has(drug.ndc)) {
        uniqueDrugs.set(drug.ndc, drug);
      }
    }

    const results = Array.from(uniqueDrugs.values());

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
