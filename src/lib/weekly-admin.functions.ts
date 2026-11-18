import { createServerFn } from '@tanstack/react-start';
import { setResponseHeader } from '@tanstack/react-start/server';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { releaseRecordSchema } from './weekly-publication';

const actionSchema = z.discriminatedUnion('action',[
 z.object({action:z.literal('download'),sourceDate:z.iso.date()}),
 z.object({action:z.literal('begin'),sourceDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),checksum:z.string().regex(/^[a-f0-9]{64}$/),count:z.number().int().positive(),previousRunId:z.string().uuid().nullable(),baseline:z.boolean()}),
 z.object({action:z.literal('stage'),runId:z.string().uuid(),records:z.array(releaseRecordSchema).min(1).max(1000)}),
 z.object({action:z.enum(['validate','compare','prepare']),runId:z.string().uuid()}),
]);
export const weeklyAdminAction = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((input:unknown)=>actionSchema.parse(input)).handler(async ({data,context})=>{
 setResponseHeader('Cache-Control','private, no-store');
 const {data:allowed,error:roleError}=await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'});
 if(roleError || !allowed) throw new Error('Forbidden');
 const {supabaseAdmin:db}=await import('@/integrations/supabase/client.server');
 if(data.action==='download') {
  const {validateCmsRelease}=await import('./weekly-repair.server');
  return validateCmsRelease(db,data.sourceDate);
 }
 let runId: string | undefined = data.action==='begin' ? undefined : data.runId;
 let stage='search';
 try {
  if(data.action==='begin') {
   const {data:id,error}=await db.rpc('nadac_begin_run',{p_source:data.sourceDate,p_checksum:data.checksum,p_expected:data.count,...(data.previousRunId ? {p_previous:data.previousRunId}:{}),p_historical:true,p_baseline:data.baseline});
   if(error) throw error; return {runId:String(id)};
  }
  if(data.action==='stage') { const {error}=await db.rpc('nadac_stage_records',{p_run:data.runId,p_records:data.records}); if(error) throw error; }
  if(data.action!=='stage') {
   stage=data.action==='validate'?'validation':data.action==='compare'?'movers':'digest';
   const {data:run,error}=await db.from('nadac_import_runs').select('status').eq('id',data.runId).single();if(error)throw error;
   const {error:startError}=await db.rpc('nadac_start_stage',{p_run:data.runId,p_stage:stage,p_retry:run.status==='failed'});if(startError)throw startError;
  }
  if(data.action==='validate') {const {error}=await db.rpc('nadac_validate_run',{p_run:data.runId});if(error)throw error;}
  if(data.action==='compare') {stage='movers';const {error:linkError}=await db.rpc('nadac_link_previous',{p_run:data.runId});if(linkError)throw linkError;const {error}=await db.rpc('nadac_compare_run',{p_run:data.runId});if(error)throw error;}
  if(data.action==='prepare') {
   stage='digest';
   const {error}=await db.rpc('nadac_prepare_digest',{p_run:data.runId,p_recipients:[]});if(error)throw error;
  }
  if(data.action==='compare' || data.action==='prepare'){const {error}=await db.rpc('nadac_complete_stage',{p_run:data.runId,p_stage:stage});if(error)throw error;}
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
 const [runs,preparations,attempts]=await Promise.all([db.rpc('nadac_pipeline_status'),db.from('weekly_digest_preparations').select('*').order('prepared_at',{ascending:false}).limit(1000),db.from('nadac_run_attempts').select('*').order('occurred_at',{ascending:false}).limit(200)]);
 if(runs.error || preparations.error || attempts.error)throw new Error('Run history unavailable');
 const {data:invariant,error:invariantError}=await db.rpc('nadac_public_invariant');
 if(invariantError)throw new Error('Publication consistency report unavailable');
 const ids=new Set((preparations.data ?? []).map(r=>r.user_id));
 const recipients=[];
 for(const id of ids) { const {data,error}=await db.auth.admin.getUserById(id);if(error)throw new Error('Recipient preview unavailable');recipients.push({userId:id,email:data.user?.email ?? null}); }
 return {runs:runs.data ?? [],preparations:preparations.data ?? [],recipients,invariant,attempts:attempts.data ?? []};
});
