import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

/** Read-only entitlement resolution. Never invokes checkout, email or subscription writes. */
export async function selectDigestRecipients(db:SupabaseClient<Database>,stripeKey:string|undefined) {
 const [profiles,roles,suppressions]=await Promise.all([db.from('profiles').select('user_id,trial_ends_at,notify_weekly_movers,stripe_customer_id'),db.from('user_roles').select('user_id').eq('role','admin'),db.from('suppressed_emails').select('email')]);
 if(profiles.error || roles.error || suppressions.error)throw new Error('Recipient data unavailable');
 const users=new Map<string,string>();
 for(let page=1;;page++) {const {data,error}=await db.auth.admin.listUsers({page,perPage:1000});if(error)throw error;for(const user of data.users)if(user.email)users.set(user.id,user.email);if(data.users.length<1000)break;}
 const admins=new Set((roles.data ?? []).map(r=>r.user_id));
 const suppressed=new Set((suppressions.data ?? []).map(r=>r.email.toLowerCase()));
 const byEmail=new Map<string,{userId:string,email:string,eligibility:string}>();
 const include=(userId:string,eligibility:string)=>{const email=users.get(userId);if(email && !suppressed.has(email.toLowerCase()))byEmail.set(email.toLowerCase(),{userId,email,eligibility});};
 for(const id of admins) include(id,'admin');
 for(const p of profiles.data ?? []) {
  if(admins.has(p.user_id) || p.notify_weekly_movers === false || !users.has(p.user_id))continue;
  if(p.trial_ends_at && Date.parse(p.trial_ends_at)>Date.now()) {include(p.user_id,'profile_trial');continue;}
  if(!stripeKey)throw new Error('Stripe eligibility cannot be verified; digest remains pending');
  let customer=p.stripe_customer_id;
  if(!customer) {
   const params=new URLSearchParams({email:users.get(p.user_id) ?? '',limit:'1'});
   const response=await fetch(`https://api.stripe.com/v1/customers?${params}`,{headers:{Authorization:`Bearer ${stripeKey}`}});
   if(!response.ok)throw new Error('Stripe customer lookup failed');const result=await response.json() as {data:Array<{id:string}>};customer=result.data[0]?.id ?? null;
  }
  if(!customer)continue;
  for(const status of ['active','trialing']) {
   const response=await fetch(`https://api.stripe.com/v1/subscriptions?${new URLSearchParams({customer,status,limit:'1'})}`,{headers:{Authorization:`Bearer ${stripeKey}`}});
   if(!response.ok)throw new Error('Stripe subscription lookup failed');const result=await response.json() as {data:unknown[]};if(result.data.length){include(p.user_id,status);break;}
  }
 }
 return [...byEmail.values()];
}
