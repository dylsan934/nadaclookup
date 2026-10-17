import { createServerFn } from '@tanstack/react-start';
import { setResponseHeader } from '@tanstack/react-start/server';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { releaseRecordSchema } from './weekly-publication';

const actionSchema = z.discriminatedUnion('action',[
 z.object({action:z.literal('begin'),sourceDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),checksum:z.string().regex(/^[a-f0-9]{64}$/),count:z.number().int().positive(),previousRunId:z.string().uuid().nullable(),baseline:z.boolean()}),
 z.object({action:z.literal('stage'),runId:z.string().uuid(),records:z.array(releaseRecordSchema).min(1).max(1000)}),
 z.object({action:z.enum(['validate','compare','prepare','finalize']),runId:z.string().uuid()}),
]);
export const weeklyAdminAction = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((input:unknown)=>actionSchema.parse(input)).handler(async ({data,context})=>{
 setResponseHeader('Cache-Control','private, no-store');
 const {data:allowed,error:roleError}=await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'});
 if(roleError || !allowed) throw new Error('Forbidden');
 const {supabaseAdmin:db}=await import('@/integrations/supabase/client.server');
 let runId: string | undefined = data.action==='begin' ? undefined : data.runId;
 let stage='search';
 try {
  if(data.action==='begin') {
   const {data:id,error}=await db.rpc('nadac_begin_run',{p_source:data.sourceDate,p_checksum:data.checksum,p_expected:data.count,...(data.previousRunId ? {p_previous:data.previousRunId}:{}),p_historical:true,p_baseline:data.baseline});
   if(error) throw error; return {runId:String(id)};
  }
  if(data.action==='stage') { const {error}=await db.rpc('nadac_stage_records',{p_run:data.runId,p_records:data.records}); if(error) throw error; }
  if(data.action==='validate') {const {error}=await db.rpc('nadac_validate_run',{p_run:data.runId});if(error)throw error;}
  if(data.action==='compare') {stage='movers';const {error}=await db.rpc('nadac_compare_run',{p_run:data.runId});if(error)throw error;}
  if(data.action==='prepare') {
   stage='digest';
   const {selectDigestRecipients}=await import('./weekly-recipients.server');
   const recipients=await selectDigestRecipients(db,process.env['STRIPE_SECRET_KEY']);
   const {error}=await db.rpc('nadac_prepare_digest',{p_run:data.runId,p_recipients:recipients.map(r=>({user_id:r.userId,eligibility:r.eligibility}))});if(error)throw error;
  }
  if(data.action==='finalize') {stage='freshness';const {error}=await db.rpc('nadac_finalize_run',{p_run:data.runId});if(error)throw error;}
  return {runId:data.runId};
 } catch(error) {
  if(runId) await db.rpc('nadac_fail_run',{p_run:runId,p_stage:stage,p_reason:error instanceof Error ? error.message : JSON.stringify(error)});
  throw new Error('Weekly stage failed. Details are available in the run history.');
 }
});
export const getWeeklyAdmin = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async ({context})=>{
 setResponseHeader('Cache-Control','private, no-store');
 const {data:allowed,error}=await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'});if(error || !allowed)throw new Error('Forbidden');
 const {supabaseAdmin:db}=await import('@/integrations/supabase/client.server');
 const [runs,preparations]=await Promise.all([db.from('nadac_import_runs').select('*').order('source_date',{ascending:false}).limit(20),db.from('weekly_digest_preparations').select('*').order('prepared_at',{ascending:false}).limit(1000)]);
 if(runs.error || preparations.error)throw new Error('Run history unavailable');
 const ids=new Set((preparations.data ?? []).map(r=>r.user_id));
 const recipients=[];
 for(const id of ids) { const {data,error}=await db.auth.admin.getUserById(id);if(error)throw new Error('Recipient preview unavailable');recipients.push({userId:id,email:data.user?.email ?? null}); }
 return {runs:runs.data ?? [],preparations:preparations.data ?? [],recipients};
});
