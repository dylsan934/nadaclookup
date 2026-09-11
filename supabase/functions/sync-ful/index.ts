import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireServiceRole } from "../_shared/require-service-role.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ACA Federal Upper Limits dataset from data.medicaid.gov
const FUL_DATASET_ID = 'ce4cf49b-a21b-5a53-bbc3-509414940847';

interface FulRecord {
  ndc: string;
  aca_ful: string;
  package_size: string;
  year: string;
  month: string;
}

function parseCSV(csvText: string): FulRecord[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const parseLine = (line: string): string[] => {
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
    return values;
  };

  const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/ /g, '_'));
  console.log('Parsed headers:', headers);

  const records: FulRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const values = parseLine(line);
    const record: any = {};
    headers.forEach((header, idx) => {
      record[header] = values[idx] || '';
    });
    records.push(record as FulRecord);
  }
  return records;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authError = requireServiceRole(req, corsHeaders);
  if (authError) return authError;

  try {
    console.log('Starting FUL data sync...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the latest year/month available in the dataset
    const metaRes = await fetch(
      `https://data.medicaid.gov/api/1/datastore/query/${FUL_DATASET_ID}/0?limit=1&sorts[0][property]=year&sorts[0][order]=desc&sorts[1][property]=month&sorts[1][order]=desc`
    );
    if (!metaRes.ok) {
      throw new Error(`Medicaid API metadata error: ${metaRes.status}`);
    }
    const meta = await metaRes.json();
    const latest = meta?.results?.[0];
    if (!latest) throw new Error('No FUL data found in dataset');

    const year = parseInt(latest.year, 10);
    const month = parseInt(latest.month, 10);
    const effectiveDate = `${year}-${String(month).padStart(2, '0')}-01`;
    console.log(`Latest FUL data: ${year}-${month} (effective ${effectiveDate})`);

    // Skip if we already have this period
    const { data: existing } = await supabase
      .from('ful_prices')
      .select('id')
      .eq('effective_date', effectiveDate)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log('FUL data already up to date');
      return new Response(JSON.stringify({
        success: true,
        message: `FUL data already current for ${effectiveDate}`,
        effectiveDate,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Download the CSV for the latest month
    const csvUrl = `https://data.medicaid.gov/api/1/datastore/query/${FUL_DATASET_ID}/0/download?conditions[0][property]=year&conditions[0][value]=${year}&conditions[0][operator]==&conditions[1][property]=month&conditions[1][value]=${month}&conditions[1][operator]==&format=csv`;
    console.log('Downloading FUL CSV...');
    const csvRes = await fetch(csvUrl);
    if (!csvRes.ok) {
      throw new Error(`Medicaid CSV download error: ${csvRes.status}`);
    }
    const csvText = await csvRes.text();
    const records = parseCSV(csvText);
    console.log(`Parsed ${records.length} FUL records`);

    if (records.length === 0) {
      throw new Error('No records parsed from FUL CSV');
    }

    // Replace table contents with the latest month
    const { error: deleteError } = await supabase
      .from('ful_prices')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (deleteError) throw deleteError;

    const sourceFileDate = new Date().toISOString().split('T')[0];
    const rows = records
      .map(r => ({
        ndc_11: (r.ndc || '').replace(/-/g, ''),
        ful_unit_price: parseFloat(r.aca_ful) || null,
        package_size: parseFloat(r.package_size) || null,
        effective_date: effectiveDate,
        source_file_date: sourceFileDate,
      }))
      .filter(r => r.ndc_11 && r.ful_unit_price !== null);

    const BATCH = 1000;
    let inserted = 0;
    for (let i = 0; i < rows.length; i += BATCH) {
      const { error } = await supabase.from('ful_prices').insert(rows.slice(i, i + BATCH));
      if (error) throw error;
      inserted += Math.min(BATCH, rows.length - i);
    }
    console.log(`Inserted ${inserted} FUL records`);

    return new Response(JSON.stringify({
      success: true,
      message: `Synced ${inserted} FUL records for ${effectiveDate}`,
      effectiveDate,
      inserted,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('FUL sync error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
