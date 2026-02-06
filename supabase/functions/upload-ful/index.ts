import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Normalize NDC to 11-digit format
function normalizeNDC(ndc: string): string {
  let cleaned = ndc.replace(/[-\s]/g, '');
  return cleaned.padStart(11, '0');
}

// Parse CSV line handling quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Verify user is admin using anon client with user's token
    const token = authHeader.replace('Bearer ', '');
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check admin role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ success: false, error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body (CSV content)
    const body = await req.json();
    const { csvContent, effectiveDate } = body;

    if (!csvContent) {
      return new Response(
        JSON.stringify({ success: false, error: 'CSV content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check file size (5MB max)
    if (csvContent.length > 5 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ success: false, error: 'File size exceeds 5MB limit' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing manual FUL CSV upload...');

    // Parse CSV
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      return new Response(
        JSON.stringify({ success: false, error: 'CSV must have header and data rows' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, '_'));
    
    // Validate required columns
    const ndcIndex = headers.findIndex(h => h.includes('ndc'));
    const priceIndex = headers.findIndex(h => h.includes('ful') || h.includes('price'));
    
    if (ndcIndex === -1 || priceIndex === -1) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'CSV must contain NDC and price columns',
          foundColumns: headers 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const packageSizeIndex = headers.findIndex(h => h.includes('package') || h.includes('size'));
    const dateIndex = headers.findIndex(h => h.includes('effective') || h.includes('date'));

    const today = effectiveDate || new Date().toISOString().split('T')[0];
    const validRecords: Array<{
      ndc_11: string;
      ful_unit_price: number;
      package_size: number;
      effective_date: string;
      source_file_date: string;
    }> = [];

    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      
      const ndcValue = values[ndcIndex] || '';
      const priceValue = values[priceIndex] || '';
      
      if (!ndcValue || !priceValue) {
        errors.push(`Row ${i + 1}: Missing NDC or price`);
        continue;
      }

      const price = parseFloat(priceValue.replace(/[$,]/g, ''));
      if (isNaN(price) || price <= 0) {
        errors.push(`Row ${i + 1}: Invalid price "${priceValue}"`);
        continue;
      }

      const normalizedNDC = normalizeNDC(ndcValue);
      if (!/^\d{11}$/.test(normalizedNDC)) {
        errors.push(`Row ${i + 1}: Invalid NDC format "${ndcValue}"`);
        continue;
      }

      const packageSize = packageSizeIndex >= 0 ? parseFloat(values[packageSizeIndex]) || 1 : 1;
      const recordDate = dateIndex >= 0 && values[dateIndex] ? values[dateIndex] : today;

      validRecords.push({
        ndc_11: normalizedNDC,
        ful_unit_price: price,
        package_size: packageSize,
        effective_date: recordDate,
        source_file_date: today,
      });
    }

    if (validRecords.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No valid records found in CSV',
          validationErrors: errors.slice(0, 10)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${validRecords.length} valid records (${errors.length} errors)`);

    // Batch upsert
    const chunkSize = 1000;
    let totalUpserted = 0;

    for (let i = 0; i < validRecords.length; i += chunkSize) {
      const chunk = validRecords.slice(i, i + chunkSize);
      
      const { error } = await adminClient
        .from('ful_prices')
        .upsert(chunk, { 
          onConflict: 'ndc_11,effective_date',
          ignoreDuplicates: false 
        });

      if (error) {
        throw error;
      }

      totalUpserted += chunk.length;
    }

    console.log(`Manual FUL upload complete. Inserted ${totalUpserted} records`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'FUL data uploaded successfully',
        totalRecords: validRecords.length,
        validationErrors: errors.length > 0 ? errors.slice(0, 10) : undefined,
        totalErrors: errors.length,
        uploadedAt: new Date().toISOString(),
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('FUL upload error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
