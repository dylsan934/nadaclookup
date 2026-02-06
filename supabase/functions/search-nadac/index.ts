import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Reimbursement calculation constants
const DISPENSING_FEE = 11.81;
const WAC_BRAND_MULTIPLIER = 1.20;
const WAC_GENERIC_MULTIPLIER = 1.08;
const WAC_UNKNOWN_MULTIPLIER = 1.15;

// Detect drug type based on name patterns
function detectDrugType(drugName: string): 'brand' | 'generic' | 'unknown' {
  const upperName = drugName.toUpperCase();
  
  // Generic indicators - chemical names, salts, etc.
  const genericPatterns = [
    /\sHCL\b/, /\sHCT\b/, /\sSODIUM\b/, /\sPOTASSIUM\b/, 
    /\sHYDROCHLORIDE\b/, /\sSULFATE\b/, /\sACETATE\b/,
    /\sMESYLATE\b/, /\sMALEATE\b/, /\sTARTRATE\b/,
    /\sMG\b/, /\sMCG\b/, /\d+MG/, /\d+MCG/,
    /\sTAB\b/, /\sCAP\b/, /\sSOLN\b/, /\sSUSP\b/,
    /\sER\b/, /\sXR\b/, /\sSR\b/, /\sCR\b/, /\sDR\b/,
  ];
  
  // Check for generic patterns
  for (const pattern of genericPatterns) {
    if (pattern.test(upperName)) {
      return 'generic';
    }
  }
  
  // Brand indicators - usually single word names without chemical suffixes
  // Also check if it's all caps with a specific format that suggests brand
  const words = drugName.trim().split(/\s+/);
  if (words.length === 1 && /^[A-Z][a-z]+$/.test(drugName)) {
    return 'brand';
  }
  
  return 'unknown';
}

// Normalize NDC to 11-digit format for matching
function normalizeNDC(ndc: string): string {
  let cleaned = ndc.replace(/[-\s]/g, '');
  return cleaned.padStart(11, '0');
}

// Calculate Louisiana Medicaid reimbursement
function calculateReimbursement(nadacPrice: number, fulPrice: number | null, drugType: 'brand' | 'generic' | 'unknown') {
  // Calculate estimated WAC
  let wacMultiplier: number;
  switch (drugType) {
    case 'brand':
      wacMultiplier = WAC_BRAND_MULTIPLIER;
      break;
    case 'generic':
      wacMultiplier = WAC_GENERIC_MULTIPLIER;
      break;
    default:
      wacMultiplier = WAC_UNKNOWN_MULTIPLIER;
  }
  
  const estimatedWac = nadacPrice * wacMultiplier;
  
  // Determine ingredient cost (minimum of available prices)
  let ingredientCost = nadacPrice;
  let ingredientCostSource: 'NADAC' | 'FUL' | 'WAC' = 'NADAC';
  
  if (fulPrice !== null && fulPrice > 0 && fulPrice < ingredientCost) {
    ingredientCost = fulPrice;
    ingredientCostSource = 'FUL';
  }
  
  if (estimatedWac < ingredientCost) {
    ingredientCost = estimatedWac;
    ingredientCostSource = 'WAC';
  }
  
  // Calculate reimbursement
  const laReimbursement = ingredientCost + DISPENSING_FEE;
  
  // Calculate margin
  const estimatedMargin = laReimbursement - nadacPrice;
  const marginPercent = nadacPrice > 0 ? ((estimatedMargin / nadacPrice) * 100) : 0;
  
  return {
    estimatedWac,
    ingredientCost,
    ingredientCostSource,
    dispensingFee: DISPENSING_FEE,
    laReimbursement,
    estimatedMargin,
    marginPercent,
  };
}

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
    const normalizeNDCSearch = (ndc: string) => ndc.replace(/[-]/g, '').replace(/^0+/, '');
    
    // Determine if searching by NDC or drug name
    const isNDC = /^[\d-]+$/.test(term);
    
    let query;
    
    if (isNDC) {
      const normalizedTerm = normalizeNDCSearch(term);
      console.log(`NDC search - original: "${term}", normalized: "${normalizedTerm}"`);
      
      query = supabase
        .from('nadac_drugs')
        .select('*')
        .or(`ndc.ilike.%${term}%,ndc.ilike.%${normalizedTerm}%`)
        .order('effective_date', { ascending: false })
        .limit(limit);
    } else {
      query = supabase
        .from('nadac_drugs')
        .select('*')
        .ilike('drug_name', `%${term}%`)
        .order('effective_date', { ascending: false })
        .limit(limit);
    }

    const { data: nadacData, error: nadacError } = await query;

    if (nadacError) {
      console.error('Database query error:', nadacError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to search database' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${nadacData?.length || 0} NADAC results`);

    // Get unique drugs by NDC, keeping only the most recent price for each
    const uniqueDrugs = new Map();
    for (const drug of nadacData || []) {
      if (!uniqueDrugs.has(drug.ndc)) {
        uniqueDrugs.set(drug.ndc, drug);
      }
    }

    const nadacResults = Array.from(uniqueDrugs.values());

    // Fetch FUL prices for all found NDCs
    const ndcList = nadacResults.map(d => normalizeNDC(d.ndc));
    
    let fulData: any[] = [];
    if (ndcList.length > 0) {
      // Get most recent FUL price for each NDC
      const { data: fulResults, error: fulError } = await supabase
        .from('ful_prices')
        .select('ndc_11, ful_unit_price, effective_date')
        .in('ndc_11', ndcList)
        .order('effective_date', { ascending: false });

      if (fulError) {
        console.error('FUL query error:', fulError);
        // Continue without FUL data - non-fatal
      } else {
        fulData = fulResults || [];
      }
    }

    // Create FUL lookup map (most recent by NDC)
    const fulMap = new Map<string, { price: number; date: string }>();
    for (const ful of fulData) {
      if (!fulMap.has(ful.ndc_11)) {
        fulMap.set(ful.ndc_11, { price: ful.ful_unit_price, date: ful.effective_date });
      }
    }

    console.log(`Found FUL prices for ${fulMap.size} NDCs`);

    // Combine NADAC with FUL and calculate reimbursement
    const results = nadacResults.map(drug => {
      const normalizedNDC = normalizeNDC(drug.ndc);
      const fulInfo = fulMap.get(normalizedNDC);
      const drugType = detectDrugType(drug.drug_name);
      const nadacPrice = parseFloat(drug.nadac_per_unit);
      
      const reimbursement = calculateReimbursement(
        nadacPrice,
        fulInfo?.price ?? null,
        drugType
      );

      return {
        ...drug,
        // FUL data
        ful_price_unit: fulInfo?.price ?? null,
        ful_effective_date: fulInfo?.date ?? null,
        // Drug classification
        drug_type: drugType,
        // Reimbursement calculations
        estimated_wac: reimbursement.estimatedWac,
        ingredient_cost: reimbursement.ingredientCost,
        ingredient_cost_source: reimbursement.ingredientCostSource,
        dispensing_fee: reimbursement.dispensingFee,
        la_reimbursement: reimbursement.laReimbursement,
        estimated_margin: reimbursement.estimatedMargin,
        margin_percent: reimbursement.marginPercent,
      };
    });

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
