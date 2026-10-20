// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll,afterAll,beforeEach,it,expect } from 'vitest';
import { emailAlertAllowed, type SavedAlert } from '@/lib/saved-alerts';
let db:PGlite;
const uid='11111111-1111-4111-8111-111111111111',sid='22222222-2222-4222-8222-222222222222';
let current:string;
async function rpc(name:string,args:unknown[]=[]) {
 const {rows}=await db.query<{v:any}>(`select public.${name}(${args.map((_,i)=>`$${i+1}`).join(',')}) v`,args);
 return rows[0]?.v;
}
beforeAll(async()=>{
 db=new PGlite();
 await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;
 create function auth.uid() returns uuid language sql as $$select null::uuid$$;
 create function public.has_role(uuid,text) returns boolean language sql as $$select false$$;
 create function public.pg_advisory_xact_lock(bigint) returns void language sql as $$select$$;
 create table nadac_drugs(ndc text,drug_name text,nadac_per_unit numeric,effective_date date,pricing_unit text,pharmacy_type text,explanation text,unique(ndc,effective_date));
 create function nadac_ndc_count() returns bigint language sql as $$select count(*) from nadac_drugs$$;
 create table weekly_movers(effective_date date unique,previous_date date,top_increases jsonb,top_decreases jsonb,total_changed int,created_at timestamptz);
 create table profiles(id uuid default gen_random_uuid(),user_id uuid,notify_saved_drugs boolean,notify_large_changes_only boolean,large_change_threshold numeric);
 create table saved_drugs(id uuid,user_id uuid,ndc text,alerts_enabled boolean,created_at timestamptz);
 create table price_alerts(id uuid default gen_random_uuid(),user_id uuid,saved_drug_id uuid,ndc text,drug_name text,old_price numeric,new_price numeric,price_change_percent numeric);
 create table email_send_log(message_id text,template_name text,recipient_email text,status text);
 create table suppressed_emails(email text);
 create table email_unsubscribe_tokens(email text,token text,used_at timestamptz);
 create table test_queue(id bigint generated always as identity,payload jsonb);
 create function enqueue_email(text,jsonb) returns bigint language sql as $$insert into test_queue(payload) values($2) returning id$$;`);
 for(const file of ['0001_nadac_weekly_finalization','0002_allow_cms_future_effective_records','0003_preserve_release_freshness_identity','0004_verified_saved_drug_alert_events'])await db.exec(readFileSync(`drizzle/migrations/${file}.sql`,'utf8'));
});
afterAll(async()=>{await db.close();});
beforeEach(async()=>{
 await db.exec('truncate nadac_saved_drug_events,price_alerts,test_queue,email_send_log,suppressed_emails,email_unsubscribe_tokens,saved_drugs,profiles,nadac_alert_delivery_state,nadac_publication,weekly_movers,nadac_release_records,weekly_digest_preparations,nadac_import_runs cascade');
 await db.query('insert into profiles(user_id,notify_saved_drugs,notify_large_changes_only,large_change_threshold) values($1,true,false,5)',[uid]);
 await db.query("insert into saved_drugs values($1,$2,'00052060201',true,now()-interval '20 days')",[sid,uid]);
 const complete=async(date:string,previous:string|null,baseline:boolean,price:string)=>{
  const id=await rpc('nadac_begin_run',[date,'a'.repeat(64),1,previous,false,baseline]);
  await rpc('nadac_stage_records',[id,JSON.stringify([{ndc:'00052060201',drug_name:'DRUG',nadac_per_unit:price,effective_date:date,pricing_unit:'EA',pharmacy_type:'Community/Independent',explanation:null}])]);
  for(const stage of ['validate','compare'])await rpc(`nadac_${stage}_run`,[id]);
  await rpc('nadac_prepare_digest',[id,'[]']);await rpc('nadac_finalize_run',[id]);return id;
 };
 const dates=(await db.query<{d:string,p:string}>("select to_char(current_date,'YYYY-MM-DD') d,to_char(current_date-7,'YYYY-MM-DD') p")).rows[0];
 if(!dates)throw new Error('Missing fixture date');
 const p=await complete(dates.p,null,true,'1.00001');current=await complete(dates.d,p,false,'1.10002');
 await db.exec("insert into nadac_alert_delivery_state values(1,now()-interval '1 hour')");
});
const preview=()=>rpc('nadac_saved_alert_preview',[sid]);
it('preserves exact NDC, unit prices and consecutive release dates',async()=>{
 const v=await preview();expect(v.reason).toBeNull();expect(v.ndc).toBe('00052060201');expect(v.oldPrice).toBe('1.00001');expect(v.newPrice).toBe('1.10002');expect(Date.parse(v.currentDate)-Date.parse(v.previousDate)).toBe(7*86400000);
});
it('zero-change release cannot prepare or queue a notification',async()=>{
 await db.query('update nadac_release_records set nadac_per_unit=1.00001 where run_id=$1',[current]);expect((await preview()).reason).toBe('unchanged');await expect(rpc('nadac_prepare_saved_alert',[sid])).rejects.toThrow('unchanged');
});
it('historical releases never send',async()=>{await db.query('update nadac_import_runs set historical=true where id=$1',[current]);expect((await preview()).reason).toBe('historical_release');});
it('any failed stage blocks delivery',async()=>{await db.query("update nadac_import_runs set digest_status='failed' where id=$1",[current]);expect((await preview()).reason).toBe('release_incomplete');});
it('pending newer releases block current notices',async()=>{await db.exec("insert into nadac_import_runs(source_date,checksum,expected_count) values(current_date+7,repeat('b',64),1)");expect((await preview()).reason).toBe('newer_release_exists');});
it('failed newer releases block current notices',async()=>{await db.exec("insert into nadac_import_runs(source_date,checksum,expected_count,status) values(current_date+7,repeat('b',64),1,'failed')");expect((await preview()).reason).toBe('newer_release_exists');});
it('stale releases cannot send',async()=>{await db.query('update nadac_import_runs set source_date=current_date-8 where id=$1',[current]);expect((await preview()).reason).toBe('stale_release');});
it('mismatched pharmacy types are non-comparable',async()=>{await db.query("update nadac_release_records set pharmacy_type='Chain' where run_id=$1",[current]);expect((await preview()).reason).toBe('non_comparable');});
it('mismatched pricing units are non-comparable',async()=>{await db.query("update nadac_release_records set pricing_unit='ML' where run_id=$1",[current]);expect((await preview()).reason).toBe('non_comparable');});
it('missing NDC records never substitute a price',async()=>{await db.query("update saved_drugs set ndc='00000000000' where id=$1",[sid]);expect((await preview()).reason).toBe('record_missing');});
it('saved-drug alert switch is respected',async()=>{await db.exec('update saved_drugs set alerts_enabled=false');expect((await preview()).reason).toBe('alerts_disabled');});
it('configured threshold is used rather than hardcoded 1 percent',async()=>{
 await db.exec('update profiles set notify_large_changes_only=true,large_change_threshold=15');expect((await preview()).reason).toBe('below_threshold');await db.exec('update profiles set large_change_threshold=5');expect((await preview()).reason).toBeNull();
});
it('activation never sends catch-up events',async()=>{await db.exec("update nadac_alert_delivery_state set activated_at=now()+interval '1 hour'");expect((await preview()).reason).toBe('before_activation');});
it('activation defaults to blocked',async()=>{await db.exec('update nadac_alert_delivery_state set activated_at=null');expect((await preview()).reason).toBe('delivery_not_activated');});
it('free accounts get in-app alert but no email entitlement',async()=>{
 const v=await preview() as SavedAlert;expect(emailAlertAllowed(v,false,false)).toBe(false);const id=await rpc('nadac_prepare_saved_alert',[sid]);expect(id).toBeTruthy();expect((await db.query('select * from price_alerts')).rows).toHaveLength(1);expect((await db.query('select * from test_queue')).rows).toHaveLength(0);
});
it('Pro access still requires preference and suppression checks',async()=>{
 const v=await preview() as SavedAlert;expect(emailAlertAllowed(v,true,false)).toBe(true);expect(emailAlertAllowed({...v,emailPreference:false},true,false)).toBe(false);expect(emailAlertAllowed(v,true,true)).toBe(false);
});
it('retries produce one in-app alert and one atomic queue handoff',async()=>{
 const id=await rpc('nadac_prepare_saved_alert',[sid]);expect(await rpc('nadac_prepare_saved_alert',[sid])).toBe(id);
 await db.exec("insert into email_unsubscribe_tokens values('fixture@example.invalid','token',null)");
 const payload=JSON.stringify({label:'saved-drug-price-change',purpose:'transactional',idempotency_key:`saved-drug:${id}`,message_id:id,to:'fixture@example.invalid',unsubscribe_token:'token'});
 expect(await rpc('nadac_enqueue_saved_alert',[id,payload])).toEqual({queued:true,duplicate:false});expect(await rpc('nadac_enqueue_saved_alert',[id,payload])).toEqual({queued:false,duplicate:true});expect((await db.query('select * from price_alerts')).rows).toHaveLength(1);expect((await db.query('select * from test_queue')).rows).toHaveLength(1);
});
it('preference changes after event preparation block queueing',async()=>{
 const id=await rpc('nadac_prepare_saved_alert',[sid]);await db.exec('update profiles set notify_saved_drugs=false');await expect(rpc('nadac_enqueue_saved_alert',[id,'{}'])).rejects.toThrow('Email alerts disabled');expect((await db.query('select * from price_alerts')).rows).toHaveLength(1);
});