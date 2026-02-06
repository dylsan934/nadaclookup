import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CMS FUL data URL - Federal Upper Limit pricing
const FUL_DATA_URL = "https://data.medicaid.gov/api/1/datastore/query/3e54d695-fa34-5017-bc7e-b2edbb246e85/0/download?format=csv";

// Normalize NDC to 11-digit format
function normalizeNDC(ndc: string): string {
  // Remove dashes and spaces
  let cleaned = ndc.replace(/[-\s]/g, '');
  // Pad with leading zeros to 11 digits
  return cleaned.padStart(11, '0');
}

// Parse CSV data
function parseCSV(csvText: string): Array<Record<string, string>> {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  
  // Parse header - handle quoted fields
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);
  
  const records: Array<Record<string, string>> = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const record: Record<string, string> = {};
      headers.forEach((header, idx) => {
        record[header.trim().toLowerCase().replace(/\s+/g, '_')] = values[idx]?.trim() || '';
      });
      records.push(record);
    }
  }
  
  return records;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  
  return result;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting FUL data sync...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current record count for validation
    const { count: previousCount } = await supabase
      .from('ful_prices')
      .select('*', { count: 'exact', head: true });

    console.log(`Previous FUL record count: ${previousCount || 0}`);

    // Fetch FUL data from CMS
    console.log('Fetching FUL data from CMS...');
    const response = await fetch(FUL_DATA_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch FUL data: ${response.status} ${response.statusText}`);
    }

    const csvText = await response.text();
    console.log(`Received ${csvText.length} bytes of CSV data`);

    // Parse CSV
    const records = parseCSV(csvText);
    console.log(`Parsed ${records.length} records from CSV`);

    if (records.length === 0) {
      throw new Error('No records found in FUL CSV data');
    }

    // Validate schema - check for required columns
    const firstRecord = records[0];
    const requiredColumns = ['ndc', 'ful_unit_price'];
    const missingColumns = requiredColumns.filter(col => {
      // Check various possible column names
      const possibleNames = [col, col.replace(/_/g, ' '), col.toUpperCase()];
      return !Object.keys(firstRecord).some(key => 
        possibleNames.some(name => key.toLowerCase().includes(name.toLowerCase().replace(/_/g, '')))
      );
    });

    if (missingColumns.length > 0) {
      console.log('Available columns:', Object.keys(firstRecord));
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    // Row count validation - warn if significantly lower than previous
    if (previousCount && records.length < previousCount * 0.8) {
      console.warn(`Warning: New record count (${records.length}) is less than 80% of previous (${previousCount})`);
    }

    // Transform and validate records
    const today = new Date().toISOString().split('T')[0];
    const validRecords: Array<{
      ndc_11: string;
      ful_unit_price: number;
      package_size: number;
      effective_date: string;
      source_file_date: string;
    }> = [];

    for (const record of records) {
      // Find NDC column (may have different names)
      const ndcValue = record['ndc'] || record['ndc_11'] || record['drug_ndc'] || '';
      const priceValue = record['ful_unit_price'] || record['ful_price'] || record['unit_price'] || '';
      const packageSize = record['package_size'] || record['pkg_size'] || '1';
      const effectiveDate = record['effective_date'] || record['eff_date'] || today;

      if (!ndcValue || !priceValue) continue;

      const price = parseFloat(priceValue);
      
      // Skip invalid prices
      if (isNaN(price) || price <= 0) continue;

      const normalizedNDC = normalizeNDC(ndcValue);
      
      // Validate NDC format (should be 11 digits)
      if (!/^\d{11}$/.test(normalizedNDC)) continue;

      validRecords.push({
        ndc_11: normalizedNDC,
        ful_unit_price: price,
        package_size: parseFloat(packageSize) || 1,
        effective_date: effectiveDate,
        source_file_date: today,
      });
    }

    console.log(`Valid records after transformation: ${validRecords.length}`);

    if (validRecords.length === 0) {
      throw new Error('No valid FUL records after transformation');
    }

    // Batch upsert in chunks of 1000
    const chunkSize = 1000;
    let totalUpserted = 0;

    for (let i = 0; i < validRecords.length; i += chunkSize) {
      const chunk = validRecords.slice(i, i + chunkSize);
      
      const { error } = await supabase
        .from('ful_prices')
        .upsert(chunk, { 
          onConflict: 'ndc_11,effective_date',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error(`Error upserting chunk at index ${i}:`, error);
        throw error;
      }

      totalUpserted += chunk.length;
      console.log(`Upserted ${totalUpserted}/${validRecords.length} records`);
    }

    console.log(`FUL sync complete. Total records: ${validRecords.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'FUL data sync completed successfully',
        totalRecords: validRecords.length,
        previousCount: previousCount || 0,
        syncedAt: new Date().toISOString(),
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('FUL sync error:', error);
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
