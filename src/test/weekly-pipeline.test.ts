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
  const r=await row(id);expect(r['search_status']).toBe('completed');expect(r['movers_status']).toBe('failed');expect(r['completed_at']).toBeNull();expect(r['failure_reason']).toContain('fixture comparison failure');expect((await status()).pendingDate).toBe('2026-10-14');
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
  // Source records for this baseline must not be effective after its publication.
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
});
it('CSV retains exact decimal price and leading-zero NDC while separating source dates',()=>{
 const csv='NDC,NDC Description,NADAC Per Unit,Effective Date,Pricing Unit,Pharmacy Type Indicator,As of Date\n00052060201,BCG (TICE STRAIN) VIAL,187.77376,10/07/2026,EA,C/I,10/14/2026';
 expect(parseRelease(csv,'2026-10-14')[0]).toMatchObject({ndc:'00052060201',nadac_per_unit:'187.77376',effective_date:'2026-10-07'});expect(()=>parseRelease(csv,'2026-10-07')).toThrow('different publication date');
});
