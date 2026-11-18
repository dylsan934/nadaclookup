import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { parseRelease } from './weekly-publication';

export const CMS_DATASET = 'fbb83258-11c7-47f5-8b18-5f8e79f7e704';
export function cmsReleaseUrl(date: string) {
  const url = new URL(`https://data.medicaid.gov/api/1/datastore/query/${CMS_DATASET}/0/download`);
  url.search = new URLSearchParams({ 'conditions[0][property]': 'as_of_date', 'conditions[0][value]': date, 'conditions[0][operator]': '=', format: 'csv' }).toString();
  return url.href;
}

/** Review phase: no publication, history writes, billing reads, alerts or email queue calls. */
export async function validateCmsRelease(db: SupabaseClient<Database>, date: string) {
  if (date === '2026-10-28') {
    const response = await fetch(cmsReleaseUrl('2026-10-21'), { signal: AbortSignal.timeout(60_000) });
    if (!response.ok) throw new Error('October 21 baseline verification unavailable');
    const expected = parseRelease(await response.text(), '2026-10-21');
    const { data: baseline, error: baselineError } = await db.from('nadac_import_runs').select('id,record_count').eq('source_date','2026-10-21').eq('status','completed').single();
    if (baselineError || !baseline || baseline.record_count !== expected.length) throw new Error('October 21 baseline requires correction review');
    const byNdc = new Map(expected.map(r => [r.ndc,r]));
    let checked = 0;
    for (let offset=0;offset<expected.length;offset+=1000) {
      const { data: rows,error }=await db.from('nadac_release_records').select('*').eq('run_id',baseline.id).order('ndc').range(offset,offset+999);
      if(error)throw new Error('Baseline read unavailable');
      for(const row of rows ?? []) {
        const source=byNdc.get(row.ndc);
        if(!source || source.drug_name!==row.drug_name || Number(source.nadac_per_unit)!==Number(row.nadac_per_unit) || source.effective_date!==row.effective_date || source.pricing_unit!==row.pricing_unit || source.pharmacy_type!==row.pharmacy_type || source.explanation!==row.explanation) throw new Error('October 21 stored snapshot differs from the current CMS artifact. Correction review required; no release staged.');
        checked++;
      }
    }
    if(checked!==expected.length)throw new Error('Incomplete baseline verification');
  }
  const { data: detected, error: detectionError } = await db.rpc('nadac_detect_release', { p_source: date, p_url: cmsReleaseUrl(date), p_dataset: CMS_DATASET });
  if (detectionError || !detected) throw new Error('Release detection failed');
  let stage = 'download';
  try {
    const { error: timeoutError } = await db.rpc('nadac_expire_runs');
    if (timeoutError) throw timeoutError;
    const { data: run, error: runError } = await db.from('nadac_import_runs').select('status,validation_status,retry_count').eq('id', detected).single();
    if (runError) throw runError;
    if (run.status === 'completed' || run.validation_status === 'completed') return { runId: detected, validated: true };
    const { error: startError } = await db.rpc('nadac_start_stage', { p_run: detected, p_stage: stage, p_retry: run.status === 'failed' });
    if (startError) throw startError;
    const response = await fetch(cmsReleaseUrl(date), { signal: AbortSignal.timeout(60_000), headers: { Accept: 'text/csv' } });
    if (!response.ok) throw new Error('CMS download unavailable');
    const csv = await response.text();
    stage = 'validation';
    const records = parseRelease(csv, date);
    const checksum = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(csv))), n => n.toString(16).padStart(2, '0')).join('');
    const { data: previous, error: previousError } = await db.from('nadac_import_runs').select('id').eq('source_date', new Date(Date.parse(`${date}T00:00:00Z`) - 7 * 86400000).toISOString().slice(0, 10)).limit(1).maybeSingle();
    if (previousError) throw previousError;
    const { data: runId, error: beginError } = await db.rpc('nadac_begin_run', { p_source: date, p_checksum: checksum, p_expected: records.length, ...(previous ? { p_previous: previous.id } : {}), p_historical: true, p_baseline: false });
    if (beginError || !runId) throw new Error('CMS artifact requires review');
    stage = 'search';
    for (let i = 0; i < records.length; i += 1000) {
      const { error } = await db.rpc('nadac_stage_records', { p_run: runId, p_records: records.slice(i, i + 1000) });
      if (error) throw error;
    }
    stage = 'validation';
    const { error } = await db.rpc('nadac_validate_run', { p_run: runId });
    if (error) throw error;
    return { runId, validated: true };
  } catch {
    await db.rpc('nadac_fail_run', { p_run: detected, p_stage: stage, p_reason: 'CMS repair stage failed' });
    throw new Error('Release could not be validated. See the private stage history; no publication or notifications occurred.');
  }
}