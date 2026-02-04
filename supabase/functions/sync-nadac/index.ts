import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// NADAC dataset ID from data.medicaid.gov
const NADAC_DATASET_ID = 'fbb83258-11c7-47f5-8b18-5f8e79f7e704';

interface NADACRecord {
  ndc_description: string;
  ndc: string;
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

  // Parse header row - handle quoted headers
  const headerLine = lines[0];
  const headers: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let j = 0; j < headerLine.length; j++) {
    const char = headerLine[j];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      headers.push(current.trim().toLowerCase().replace(/ /g, '_'));
      current = '';
    } else {
      current += char;
    }
  }
  headers.push(current.trim().toLowerCase().replace(/ /g, '_'));

  console.log('Parsed headers:', headers);
  
  const records: NADACRecord[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Handle CSV parsing with quoted fields
    const values: string[] = [];
    current = '';
    inQuotes = false;
    
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

    // Map to object using normalized headers
    const record: any = {};
    headers.forEach((header, idx) => {
      record[header] = values[idx] || '';
    });

    records.push(record as NADACRecord);
  }

  return records;
}

function parseDate(dateStr: string): string {
  // Handle MM/DD/YYYY format from CSV
  if (!dateStr) return new Date().toISOString().split('T')[0];
  
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [month, day, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Already in YYYY-MM-DD format
  return dateStr;
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
    
    // Helper to format date as YYYY-MM-DD (required by Medicaid API)
    const formatDateForApi = (d: Date): string => {
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const year = d.getFullYear();
      return `${year}-${month}-${day}`;
    };
    
    // Try the last 14 days (NADAC updates weekly on Wednesdays)
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      datesToTry.push(formatDateForApi(date));
    }

    console.log('Dates to try:', datesToTry.slice(0, 5), '...');

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
      
      // Check if we got actual data (more than just headers)
      const lineCount = csvText.split('\n').length;
      if (!csvText || lineCount < 10) {
        console.log(`Date ${asOfDate} returned only ${lineCount} lines, trying next...`);
        continue;
      }

      console.log(`Got CSV data for ${asOfDate} with ${lineCount} lines, parsing...`);
      successfulDate = asOfDate;

      const records = parseCSV(csvText);
      console.log(`Parsed ${records.length} records`);

      if (records.length === 0) {
        console.log('No records parsed, trying next date...');
        continue;
      }

      // Log first record to verify parsing
      console.log('First record sample:', JSON.stringify(records[0]));

      // Transform and insert records in batches
      const batchSize = 500;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        
        const drugsToInsert = batch
          .filter(record => record.ndc && record.nadac_per_unit)
          .map(record => ({
            ndc: String(record.ndc).padStart(11, '0'), // Ensure NDC is properly formatted
            drug_name: record.ndc_description || 'Unknown',
            nadac_per_unit: parseFloat(record.nadac_per_unit) || 0,
            effective_date: parseDate(record.effective_date || record.as_of_date || asOfDate),
            pricing_unit: record.pricing_unit || 'EA',
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
              ignoreDuplicates: false 
            });

          if (insertError) {
            console.error('Insert error:', insertError.message);
            // Log a sample of what we tried to insert
            console.log('Sample insert attempt:', JSON.stringify(drugsToInsert[0]));
          } else {
            totalInserted += drugsToInsert.length;
            if (i % 5000 === 0) {
              console.log(`Batch ${i / batchSize + 1} inserted. Total: ${totalInserted}`);
            }
          }
        }
      }

      // We found and processed data, break out of the date loop
      if (totalInserted > 0) {
        break;
      }
    }

    if (totalInserted === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Could not sync NADAC data. Check logs for details.' 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Sync complete. Total records processed: ${totalInserted}`);

    // Trigger price alerts check after successful sync
    let alertsResult = null;
    try {
      console.log('Triggering price alerts check...');
      const alertsResponse = await fetch(
        `${supabaseUrl}/functions/v1/check-price-alerts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
        }
      );
      
      if (alertsResponse.ok) {
        alertsResult = await alertsResponse.json();
        console.log('Price alerts check completed:', alertsResult);
      } else {
        console.error('Price alerts check failed:', alertsResponse.status);
      }
    } catch (alertsError) {
      console.error('Error triggering price alerts:', alertsError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Synced ${totalInserted} NADAC records for ${successfulDate}`,
        totalRecords: totalInserted,
        asOfDate: successfulDate,
        alertsTriggered: alertsResult?.alertsSent || 0
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
