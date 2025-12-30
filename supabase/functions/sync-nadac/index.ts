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

    // Get the latest date from data.medicaid.gov
    // Fetch the most recent NADAC data (limit to manageable batch)
    const limit = 5000; // Fetch in batches
    let offset = 0;
    let totalInserted = 0;
    let hasMore = true;

    // Get the most recent effective date from our database
    const { data: latestRecord } = await supabase
      .from('nadac_drugs')
      .select('effective_date')
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();

    const latestDate = latestRecord?.effective_date;
    console.log('Latest date in database:', latestDate);

    while (hasMore && offset < 100000) { // Cap at 100k records for safety
      const apiUrl = `https://data.medicaid.gov/resource/${NADAC_DATASET_ID}.json?$limit=${limit}&$offset=${offset}&$order=as_of_date DESC`;
      
      console.log(`Fetching records from offset ${offset}...`);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Medicaid API returned ${response.status}: ${response.statusText}`);
      }

      const records: NADACRecord[] = await response.json();
      console.log(`Fetched ${records.length} records`);

      if (records.length === 0) {
        hasMore = false;
        break;
      }

      // Transform and insert records
      const drugsToInsert = records
        .filter(record => record.ndc && record.nadac_per_unit)
        .map(record => ({
          ndc: record.ndc,
          drug_name: record.ndc_description || 'Unknown',
          nadac_per_unit: parseFloat(record.nadac_per_unit) || 0,
          effective_date: record.effective_date || record.as_of_date,
          pricing_unit: record.pricing_unit || 'EACH',
          pharmacy_type: record.pharmacy_type_indicator === 'C/I' ? 'Community/Independent' : 
                         record.pharmacy_type_indicator === 'C/C' ? 'Chain' : 
                         record.pharmacy_type_indicator || 'Unknown',
          explanation: record.explanation_code || null,
        }));

      if (drugsToInsert.length > 0) {
        // Use upsert to handle duplicates (same NDC + effective_date)
        const { error: insertError } = await supabase
          .from('nadac_drugs')
          .upsert(drugsToInsert, { 
            onConflict: 'ndc,effective_date',
            ignoreDuplicates: true 
          });

        if (insertError) {
          console.error('Insert error:', insertError);
          // Continue processing even if some inserts fail
        } else {
          totalInserted += drugsToInsert.length;
          console.log(`Inserted/updated ${drugsToInsert.length} records. Total: ${totalInserted}`);
        }
      }

      // If we got less than the limit, we've reached the end
      if (records.length < limit) {
        hasMore = false;
      }

      offset += limit;

      // For initial sync, just get the most recent week's data
      // Check if we've gone back far enough
      if (records.length > 0 && latestDate) {
        const oldestInBatch = records[records.length - 1].effective_date || records[records.length - 1].as_of_date;
        if (oldestInBatch && new Date(oldestInBatch) < new Date(latestDate)) {
          console.log('Reached data we already have, stopping sync');
          hasMore = false;
        }
      }

      // For initial sync, limit to first batch to avoid timeout
      if (!latestDate && offset >= limit) {
        console.log('Initial sync: fetched first batch, stopping to avoid timeout');
        hasMore = false;
      }
    }

    console.log(`Sync complete. Total records processed: ${totalInserted}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Synced ${totalInserted} NADAC records`,
        totalRecords: totalInserted 
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
