import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { savedAlertSchema, emailAlertAllowed } from './saved-alerts';

export async function readSavedAlert(db:SupabaseClient<Database>,savedId:string) {
 const {data,error}=await db.rpc('nadac_saved_alert_preview',{p_saved:savedId});
 if(error)throw new Error('Unable to verify saved-drug comparison');
 return savedAlertSchema.parse(data);
}
// Exact account email is read privately; profile customer identifiers alone never prove entitlement.
export async function recipientEligibility(db:SupabaseClient<Database>,userId:string,key:string|undefined) {
 const [account,profile]=await Promise.all([db.auth.admin.getUserById(userId),db.from('profiles').select('trial_ends_at,notify_saved_drugs').eq('user_id',userId).single()]);
 if(account.error || profile.error)throw new Error('Unable to verify recipient');
 const email=account.data.user?.email?.toLowerCase();
 if(!email || !account.data.user?.email_confirmed_at) return {email:null,pro:false,suppressed:true};
 const {data:suppress,error}=await db.from('suppressed_emails').select('id').eq('email',email).maybeSingle();
 if(error)throw new Error('Unable to verify suppression');
 if(suppress || !profile.data.notify_saved_drugs)return {email,pro:false,suppressed:Boolean(suppress)};
 if(profile.data.trial_ends_at && Date.parse(profile.data.trial_ends_at)>Date.now())return {email,pro:true,suppressed:false};
 if(!key)throw new Error('Unable to verify Pro access');
 const headers={Authorization:`Bearer ${key}`};
 const customers=await fetch(`https://api.stripe.com/v1/customers?${new URLSearchParams({email,limit:'100'})}`,{headers});
 if(!customers.ok)throw new Error('Unable to verify Pro access');
 const result=await customers.json() as {data:Array<{id:string,email:string|null}>,has_more:boolean};
 if(result.has_more)throw new Error('Ambiguous account eligibility');
 let pro=false;
 for(const customer of result.data.filter(c=>c.email?.toLowerCase()===email)) {
  const response=await fetch(`https://api.stripe.com/v1/subscriptions?${new URLSearchParams({customer:customer.id,status:'all',limit:'100'})}`,{headers});
  if(!response.ok)throw new Error('Unable to verify Pro access');
  const subscriptions=await response.json() as {data:Array<{status:string}>,has_more:boolean};
  if(subscriptions.has_more)throw new Error('Ambiguous subscription eligibility');
  pro ||= subscriptions.data.some(s=>s.status==='active' || s.status==='trialing');
 }
 return {email,pro,suppressed:false};
}
export async function verifiedEmailEvent(db:SupabaseClient<Database>,eventId:string,key:string|undefined) {
 const {data:event,error}=await db.from('nadac_saved_drug_events').select('*').eq('id',eventId).single();
 if(error)throw new Error('Saved-drug event unavailable');
 const comparison=await readSavedAlert(db,event.saved_drug_id);
 const recipient=await recipientEligibility(db,event.user_id,key);
 if(!emailAlertAllowed(comparison,recipient.pro,recipient.suppressed) || !recipient.email || comparison.runId!==event.run_id || comparison.userId!==event.user_id)throw new Error('Saved-drug email blocked by verification');
 return {event,comparison,email:recipient.email};
}