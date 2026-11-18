// @vitest-environment node
import { beforeEach, afterEach, describe, it, expect } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { visiblePublication, publicationSchema, parseRelease } from '@/lib/weekly-publication';

let db:PGlite;
const record=(ndc='00052060201',price='187.77376')=>({ndc,drug_name:'BCG (TICE STRAIN) VIAL',nadac_per_unit:price,effective_date:'2026-10-07',pricing_unit:'EA',pharmacy_type:'Community/Independent',explanation:null});
const first = (rows:Record<string,any>[]) => { const r=rows[0];if(!r)throw new Error('Expected database result');return r; };
const rpc=async(fn:string,args:unknown[]):Promise<any> => first((await db.query<Record<string,any>>(`select public.${fn}(${args.map((_,i)=>`$${i+1}`).join(',')}) as value`,args)).rows)['value'];
const begin=(date:string,prev:string|null,baseline=false)=>rpc('nadac_begin_run',[date,'a'.repeat(64),1,prev,true,baseline]);
const stage=(id:string,price='187.77376')=>rpc('nadac_stage_records',[id,JSON.stringify([record('00052060201',price)])]);
async function completed(date:string,prev:string|null,baseline=false,price='187.77376') {
 const id=await begin(date,prev,baseline);await rpc('nadac_stage_records',[id,JSON.stringify([{...record('00052060201',price),effective_date:date}])]);await rpc('nadac_validate_run',[id]);await rpc('nadac_compare_run',[id]);await rpc('nadac_prepare_digest',[id,'[]']);await rpc('nadac_finalize_run',[id]);return id as string;
}
async function row(id:string){return first((await db.query<Record<string,any>>('select * from public.nadac_import_runs where id=$1',[id])).rows);}
async function status(){return publicationSchema.parse(await rpc('nadac_public_status',[]));}
describe('weekly pipeline PostgreSQL engine integration (isolated, rolled back)',()=>{
 beforeEach(async()=>{
  db=new PGlite();
  await db.exec(`
   create role anon; create role authenticated; create role service_role;
   create schema auth; create schema pgmq;
   create function auth.uid() returns uuid language sql as $$select null::uuid$$;
   create function public.has_role(uuid,text) returns boolean language sql as $$select false$$;
   create function public.pg_advisory_xact_lock(bigint) returns void language sql as $$select$$;
   create table public.nadac_drugs(ndc text,drug_name text,nadac_per_unit numeric,effective_date date,pricing_unit text,pharmacy_type text,explanation text,unique(ndc,effective_date));
   create function public.nadac_ndc_count() returns bigint language sql as $$select count(distinct ndc) from public.nadac_drugs$$;
   create table public.weekly_movers(id uuid default gen_random_uuid(),effective_date date unique,previous_date date,top_increases jsonb,top_decreases jsonb,total_changed integer,created_at timestamptz default now());
   create table public.email_send_log(id uuid); create table pgmq.q_transactional_emails(id bigint);
  `);
  await db.exec(readFileSync('drizzle/migrations/0001_nadac_weekly_finalization.sql','utf8'));
  await db.exec(readFileSync('drizzle/migrations/0002_allow_cms_future_effective_records.sql','utf8'));
  await db.exec(readFileSync('drizzle/migrations/0003_preserve_release_freshness_identity.sql','utf8'));
  await db.exec(readFileSync('drizzle/migrations/0005_unified_published_nadac_snapshot.sql','utf8'));
  await db.exec(readFileSync('drizzle/migrations/0006_durable_weekly_release_attempts.sql','utf8'));
  await db.exec(readFileSync('drizzle/migrations/0007_complete_retryable_release_stages.sql','utf8'));
  await db.exec(readFileSync('drizzle/migrations/0008_validated_snapshot_preview_comparisons.sql','utf8'));
  await db.exec(readFileSync('drizzle/migrations/0009_mark_review_ready_releases.sql','utf8'));
  await db.query('begin');
  await db.query('update public.nadac_publication set current_run_id=null where id=1');
 });
 afterEach(async()=>{if(db){await db.query('rollback');await db.close();}});
 it('full October 14 run advances current only after all required stages',async()=>{
  const p=await completed('2026-10-07',null,true);const id=await begin('2026-10-14',p);await stage(id);await rpc('nadac_validate_run',[id]);await rpc('nadac_compare_run',[id]);
  await db.query('savepoint incomplete');await expect(rpc('nadac_finalize_run',[id])).rejects.toThrow('All stages must succeed');await db.query('rollback to savepoint incomplete');
  expect((await status()).runId).not.toBe(id);await rpc('nadac_prepare_digest',[id,'[]']);await rpc('nadac_finalize_run',[id]);
  expect((await status()).runId).toBe(id);expect((await row(id))['freshness_status']).toBe('completed');
 });
 it('Movers failure after ingestion remains unfinalized and records failure',async()=>{
  const p=await completed('2026-10-07',null,true);const id=await begin('2026-10-14',p);await stage(id);await rpc('nadac_validate_run',[id]);await rpc('nadac_fail_run',[id,'movers','fixture comparison failure']);
  const r=await row(id);expect(r['search_status']).toBe('completed');expect(r['movers_status']).toBe('failed');expect(r['completed_at']).toBeNull();expect(r['failure_reason']).toContain('Stage failed');expect((await status()).pendingDate).toBe('2026-10-14');
 });
 it('safe retry preserves run identity, record count and one finalized result',async()=>{
  const p=await completed('2026-10-07',null,true);const id=await begin('2026-10-14',p);await stage(id);await stage(id);await rpc('nadac_validate_run',[id]);await rpc('nadac_fail_run',[id,'movers','retry']);
  expect(await begin('2026-10-14',p)).toBe(id);expect((await row(id))['record_count']).toBe(1);await rpc('nadac_compare_run',[id]);await rpc('nadac_prepare_digest',[id,'[]']);await rpc('nadac_finalize_run',[id]);const timestamp=(await row(id))['completed_at'];
  await rpc('nadac_finalize_run',[id]);expect((await row(id))['completed_at']).toEqual(timestamp);expect((await db.query<Record<string,any>>('select count(*)::int n from public.weekly_movers where run_id=$1',[id])).rows[0]?.['n']).toBe(1);
 });
 it('October 14 zero-change week replaces prior increases with empty rankings',async()=>{
  const b=await completed('2026-09-30',null,true,'182.30285');const p=await completed('2026-10-07',b,false);expect((await row(p))['total_changed']).toBe(1);
  const id=await completed('2026-10-14',p);const r=await row(id);expect(r['total_changed']).toBe(0);expect(r['unchanged_count']).toBe(1);expect((await status()).topIncreases).toEqual([]);expect(visiblePublication(await status()).biggestMover).toBeUndefined();
 });
 it('October 14 requires October 7, rejecting October 1 baseline',async()=>{
  // Publication identity, not per-record effective date, determines the previous release.
  const p=await begin('2026-10-01',null,true);await rpc('nadac_stage_records',[p,JSON.stringify([{...record(),effective_date:'2026-10-01'}])]);await rpc('nadac_validate_run',[p]);await rpc('nadac_compare_run',[p]);await rpc('nadac_prepare_digest',[p,'[]']);await rpc('nadac_finalize_run',[p]);
  await db.query('savepoint wrong_previous');await expect(begin('2026-10-14',p)).rejects.toThrow('Immediately preceding');await db.query('rollback to savepoint wrong_previous');
 });
 it('homepage and Movers use October 14 versus October 7 and actual completion',async()=>{
  const p=await completed('2026-10-07',null,true);const id=await completed('2026-10-14',p);const publicData=await status(),home=visiblePublication(publicData);
  expect(home.date).toBe('2026-10-14');expect(home.previousDate).toBe('2026-10-07');expect(home.completedAt).toBe(publicData.completedAt);expect(publicData.completedAt).not.toBeNull();expect(publicData.runId).toBe(id);
 });
 it('repeated digest preparation has one identity and makes no send/queue entries',async()=>{
  const p=await completed('2026-10-07',null,true);const id=await begin('2026-10-14',p);await stage(id);await rpc('nadac_validate_run',[id]);await rpc('nadac_compare_run',[id]);
  const counts=async()=> (await db.query<Record<string,any>>('select (select count(*) from public.email_send_log)::int logs,(select count(*) from pgmq.q_transactional_emails)::int queue')).rows[0];const before=await counts();
  const recipients=JSON.stringify([{user_id:'a9bad2b3-4c95-4592-9291-04665af6386f',eligibility:'admin'}]);await rpc('nadac_prepare_digest',[id,recipients]);await rpc('nadac_prepare_digest',[id,recipients]);
  expect((await db.query<Record<string,any>>('select count(*)::int n,bool_and(preview_only) preview from public.weekly_digest_preparations where run_id=$1',[id])).rows[0]).toEqual({n:1,preview:true});expect(await counts()).toEqual(before);
 });
 it('failed newer run suppresses stale biggest-mover even if old rankings exist',async()=>{
  const b=await completed('2026-09-30',null,true,'182.30285'),p=await completed('2026-10-07',b);expect((await row(p))['top_increases']).toHaveLength(1);
  const id=await begin('2026-10-14',p);await stage(id);await rpc('nadac_validate_run',[id]);await rpc('nadac_fail_run',[id,'movers','failure']);const s=await status();expect(s.pendingDate).toBe('2026-10-14');expect(s.topIncreases).toEqual([]);expect(visiblePublication(s).biggestMover).toBeUndefined();expect(s.runId).toBe(p);
 });
 it('newer legacy ingestion is processing without superseding finalized publication identity',async()=>{
  const p=await completed('2026-10-07',null,true);await completed('2026-10-14',p);
  await db.query("insert into public.nadac_drugs values ('00052060201','BCG (TICE STRAIN) VIAL',187.77376,'2026-10-15','EA','Community/Independent',null)");
  const s=await status();expect(s.currentDate).toBe('2026-10-14');expect(s.pendingDate).toBeNull();
 });
 it('October 21 versus October 14 uses one immutable snapshot across public surfaces',async()=>{
  const p=await completed('2026-10-14',null,true),id=await completed('2026-10-21',p,false,'190');
  const s=await status();expect(s.currentDate).toBe('2026-10-21');expect(s.previousDate).toBe('2026-10-14');expect(s.totalChanged).toBe(1);
  const report=await rpc('nadac_public_invariant',[]);expect(report.ok).toBe(true);
  for(const field of ['searchPublicationDate','drugPagePublicationDate','homepagePublicationDate','moversPublicationDate'])expect(report[field]).toBe('2026-10-21');
  const prices=(await db.query<Record<string,any>>('select * from nadac_published_drugs')).rows;
  expect(prices).toHaveLength(1);expect(prices[0]?.['run_id']).toBe(id);expect(Number(prices[0]?.['nadac_per_unit'])).toBe(190);
  expect((await db.query('select * from nadac_drugs')).rows).toHaveLength(0);
 });
 it('drug-page failure blocks publication and revalidation allows safe retry',async()=>{
  const p=await completed('2026-10-14',null,true),id=await begin('2026-10-21',p);await stage(id);await rpc('nadac_validate_run',[id]);await rpc('nadac_compare_run',[id]);await rpc('nadac_prepare_digest',[id,'[]']);
  await rpc('nadac_fail_run',[id,'drug_pages','readiness failure']);
  await db.query('savepoint gate');await expect(rpc('nadac_finalize_run',[id])).rejects.toThrow('All stages');await db.query('rollback to savepoint gate');
  expect((await status()).runId).not.toBe(id);await rpc('nadac_validate_run',[id]);await rpc('nadac_finalize_run',[id]);expect((await status()).runId).toBe(id);
 });
 it('rejects incomplete or rejected records rather than publishing partial data',async()=>{
  const p=await completed('2026-10-14',null,true),id=await begin('2026-10-21',p);await stage(id);await db.query('update nadac_import_runs set rejected_count=1 where id=$1',[id]);
  await db.query('savepoint rejected');await expect(rpc('nadac_validate_run',[id])).rejects.toThrow('Incomplete or invalid');await db.query('rollback to savepoint rejected');expect((await status()).runId).not.toBe(id);
 });
 it('October 21 zero-change result stays valid and retry queues no notifications',async()=>{
  const p=await completed('2026-10-14',null,true),id=await completed('2026-10-21',p);
  expect((await status()).totalChanged).toBe(0);expect((await status()).topIncreases).toEqual([]);expect((await status()).topDecreases).toEqual([]);
  await rpc('nadac_validate_run',[id]);await rpc('nadac_compare_run',[id]);await rpc('nadac_prepare_digest',[id,'[]']);await rpc('nadac_finalize_run',[id]);
  expect((await db.query<Record<string,any>>('select count(*)::int n from weekly_movers where run_id=$1',[id])).rows[0]?.['n']).toBe(1);
  expect((await db.query<Record<string,any>>('select (select count(*) from email_send_log)::int logs,(select count(*) from pgmq.q_transactional_emails)::int queue')).rows[0]).toEqual({logs:0,queue:0});
 });
 it('reports effective-date mismatch without rewriting the original record date',async()=>{
  const p=await completed('2026-10-14',null,true),id=await begin('2026-10-21',p);
  await stage(id);await rpc('nadac_validate_run',[id]);await rpc('nadac_compare_run',[id]);await rpc('nadac_prepare_digest',[id,'[]']);await rpc('nadac_finalize_run',[id]);
  const report=await rpc('nadac_public_invariant',[]);expect(report.ok).toBe(true);expect(report.effectiveDateMismatch).toBe(false);expect(report.maxSearchableEffectiveDate).toBe('2026-10-07');expect(report.homepagePublicationDate).toBe('2026-10-21');
  expect((await db.query<Record<string,any>>('select effective_date::text date from nadac_published_drugs')).rows[0]?.['date']).toBe('2026-10-07');
 });
 it('later release validates independently after earlier failure',async()=>{
  const p=await completed('2026-10-21',null,true),a=await begin('2026-10-28',p);await rpc('nadac_fail_run',[a,'download','failure']);
  const b=await begin('2026-11-04',a);await stage(b);await rpc('nadac_validate_run',[b]);expect((await row(b))['validation_status']).toBe('completed');
  await db.query('savepoint gap');await expect(rpc('nadac_compare_run',[b])).rejects.toThrow('Immediately preceding');await db.query('rollback to savepoint gap');expect((await row(a))['status']).toBe('failed');
 });
 it('two-hour deadline exposes and persists timeout, retry increments once',async()=>{
  const p=await completed('2026-10-21',null,true),id=await begin('2026-10-28',p);await rpc('nadac_start_stage',[id,'download',false]);
  await db.query("update nadac_import_runs set deadline_at=now()-interval '1 second' where id=$1",[id]);
  const rows=(await db.query<Record<string,any>>('select * from nadac_pipeline_status()')).rows;expect(rows.find(r=>r['id']===id)?.['status']).toBe('failed');expect((await status()).publicationDelayed).toBe(true);
  expect(await rpc('nadac_expire_runs',[])).toBe(1);expect(await rpc('nadac_expire_runs',[])).toBe(0);expect((await row(id))['failure_stage']).toBe('download');await rpc('nadac_start_stage',[id,'download',true]);expect((await row(id))['retry_count']).toBe(1);
 });
 it('distinct release detections retain independent identities',async()=>{
  const url='https://data.medicaid.gov/api/test',dataset='fbb83258-11c7-47f5-8b18-5f8e79f7e704';const a=await rpc('nadac_detect_release',['2026-10-28',url,dataset]),b=await rpc('nadac_detect_release',['2026-11-04',url,dataset]);expect(a).not.toBe(b);expect(await rpc('nadac_detect_release',['2026-10-28',url,dataset])).toBe(a);
 });
 it('finalized Movers resist legacy overwrite',async()=>{
  const p=await completed('2026-10-21',null,true),id=await completed('2026-10-28',p);await db.query('savepoint overwrite');await expect(db.query('update weekly_movers set total_changed=1000 where run_id=$1',[id])).rejects.toThrow('immutable');await db.query('rollback to savepoint overwrite');expect((await rpc('nadac_public_invariant',[])).ok).toBe(true);
 });
 it('private completed preparation awaits review without changing public release',async()=>{
  const p=await completed('2026-10-21',null,true),id=await begin('2026-10-28',p);await stage(id);await rpc('nadac_validate_run',[id]);await rpc('nadac_compare_run',[id]);await rpc('nadac_prepare_digest',[id,'[]']);await rpc('nadac_complete_stage',[id,'digest']);expect((await row(id))['status']).toBe('awaiting_review');expect((await row(id))['deadline_at']).toBeNull();expect((await status()).runId).not.toBe(id);
 });
 it('sanitizes failure details before saving history',async()=>{
  const p=await completed('2026-10-21',null,true),id=await begin('2026-10-28',p);await rpc('nadac_fail_run',[id,'download','https://private.test?token=SECRET person@example.test']);const r=await row(id);expect(r['failure_reason']).not.toContain('SECRET');expect(r['failure_reason']).not.toContain('@');expect(r['failure_stage']).toBe('download');
 });
});
it('CSV retains exact decimal price and leading-zero NDC while separating source dates',()=>{
 const csv='NDC,NDC Description,NADAC Per Unit,Effective Date,Pricing Unit,Pharmacy Type Indicator,As of Date\n00052060201,BCG (TICE STRAIN) VIAL,187.77376,10/07/2026,EA,C/I,10/14/2026';
 expect(parseRelease(csv,'2026-10-14')[0]).toMatchObject({ndc:'00052060201',nadac_per_unit:'187.77376',effective_date:'2026-10-07'});expect(()=>parseRelease(csv,'2026-10-07')).toThrow('different publication date');
});
it('CMS future-effective entries retain their date without changing publication identity',()=>{
 const csv='NDC,NDC Description,NADAC Per Unit,Effective Date,Pricing Unit,Pharmacy Type Indicator,As of Date\n00052060201,BCG (TICE STRAIN) VIAL,187.77376,10/01/2026,EA,C/I,09/30/2026';
 expect(parseRelease(csv,'2026-09-30')[0]?.effective_date).toBe('2026-10-01');
});
