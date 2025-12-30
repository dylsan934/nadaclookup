import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// NADAC dataset ID from data.medicaid.gov
const NADAC_DATASET_ID = 'f38d0706-1239-442c-a3cc-40ef1b686ac0';

interface NADACRecord {
  ndc: string;
  ndc_description: string;
  nadac_per_unit: string;
  effective_date: string;
  pricing_unit: string;
  pharmacy_type_indicator: string;
  otc: string;
  explanation_code: string;
  classification_for_rate_setting: string;
  as_of_date: string;
}

function parseCSV(csvText: string): NADACRecord[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  // Parse header row
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
  
  const records: NADACRecord[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Handle CSV parsing with quoted fields
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    // Map to object
    const record: any = {};
    headers.forEach((header, idx) => {
      record[header] = values[idx] || '';
    });

    records.push(record as NADACRecord);
  }

  return records;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting NADAC data sync...');

    // Initialize Supabase client with service role for write access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the most recent effective date from our database
    const { data: latestRecord } = await supabase
      .from('nadac_drugs')
      .select('effective_date')
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();

    const latestDate = latestRecord?.effective_date;
    console.log('Latest date in database:', latestDate);

    // Get today's date and recent dates to try
    const today = new Date();
    const datesToTry: string[] = [];
    
    // Try the last 7 days (NADAC updates weekly on Wednesdays)
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      datesToTry.push(date.toISOString().split('T')[0]);
    }

    console.log('Dates to try:', datesToTry);

    let totalInserted = 0;
    let successfulDate: string | null = null;

    for (const asOfDate of datesToTry) {
      // Use the correct API URL format provided by the user
      const apiUrl = `https://data.medicaid.gov/api/1/datastore/query/${NADAC_DATASET_ID}/0/download?conditions[0][property]=as_of_date&conditions[0][value]=${asOfDate}&conditions[0][operator]==&format=csv`;
      
      console.log(`Trying date ${asOfDate}...`);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'text/csv',
        },
      });

      if (!response.ok) {
        console.log(`Date ${asOfDate} returned ${response.status}, trying next...`);
        continue;
      }

      const csvText = await response.text();
      
      // Check if we got actual data
      if (!csvText || csvText.trim().length < 100) {
        console.log(`Date ${asOfDate} returned empty or minimal data, trying next...`);
        continue;
      }

      console.log(`Got CSV data for ${asOfDate}, parsing...`);
      successfulDate = asOfDate;

      const records = parseCSV(csvText);
      console.log(`Parsed ${records.length} records`);

      if (records.length === 0) {
        continue;
      }

      // Transform and insert records in batches
      const batchSize = 500;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        
        const drugsToInsert = batch
          .filter(record => record.ndc && record.nadac_per_unit)
          .map(record => ({
            ndc: record.ndc,
            drug_name: record.ndc_description || 'Unknown',
            nadac_per_unit: parseFloat(record.nadac_per_unit) || 0,
            effective_date: record.effective_date || record.as_of_date || asOfDate,
            pricing_unit: record.pricing_unit || 'EACH',
            pharmacy_type: record.pharmacy_type_indicator === 'C/I' ? 'Community/Independent' : 
                           record.pharmacy_type_indicator === 'C/C' ? 'Chain' : 
                           record.pharmacy_type_indicator || 'Unknown',
            explanation: record.explanation_code || null,
          }));

        if (drugsToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from('nadac_drugs')
            .upsert(drugsToInsert, { 
              onConflict: 'ndc,effective_date',
              ignoreDuplicates: true 
            });

          if (insertError) {
            console.error('Insert error:', insertError);
          } else {
            totalInserted += drugsToInsert.length;
            console.log(`Batch inserted. Total: ${totalInserted}`);
          }
        }
      }

      // We found data, break out of the date loop
      break;
    }

    if (totalInserted === 0 && !successfulDate) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Could not find NADAC data for recent dates. The data may not be available yet.' 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Sync complete. Total records processed: ${totalInserted}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Synced ${totalInserted} NADAC records for ${successfulDate}`,
        totalRecords: totalInserted,
        asOfDate: successfulDate
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('NADAC sync error:', error);
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
