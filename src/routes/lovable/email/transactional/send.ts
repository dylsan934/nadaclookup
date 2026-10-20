import { createFileRoute } from '@tanstack/react-router';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// One specific persisted saved-drug event per request. Never accept recipient or price input.
export const Route=createFileRoute('/lovable/email/transactional/send')({server:{handlers:{POST:async({request})=>{
 const url=process.env['SUPABASE_URL'],key=process.env['SUPABASE_SERVICE_ROLE_KEY'];
 if(!url || !key)return Response.json({error:'Email configuration unavailable'},{status:503});
 const bearer=request.headers.get('authorization')?.replace(/^Bearer /,'');
 if(!bearer)return Response.json({error:'Unauthorized'},{status:401});
 const db=createClient<import('@/integrations/supabase/types').Database>(url,key,{auth:{persistSession:false}});
 const {data:{user},error:authError}=await db.auth.getUser(bearer);
 if(authError || !user)return Response.json({error:'Unauthorized'},{status:401});
 // Caller role is checked through their own authenticated client, never the privileged client.
 const publishable=process.env['SUPABASE_PUBLISHABLE_KEY'] ?? import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'];
 const caller=createClient(url,publishable,{global:{headers:{Authorization:`Bearer ${bearer}`}},auth:{persistSession:false}});
 const {data:admin,error:roleError}=await caller.rpc('has_role',{_user_id:user.id,_role:'admin'});
 if(roleError || !admin)return Response.json({error:'Forbidden'},{status:403});
 const parsed=z.object({templateName:z.literal('saved-drug-price-change'),eventId:z.string().uuid()}).strict().safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return Response.json({error:'A verified saved-drug event is required'},{status:400});
 try {
  const {verifiedEmailEvent}=await import('@/lib/saved-alerts.server');
  const {event,comparison,email}=await verifiedEmailEvent(db,parsed.data.eventId,process.env['STRIPE_SECRET_KEY']);
  if(event.queued_at)return Response.json({queued:false,duplicate:true});
  const {data:tokenRow,error:tokenError}=await db.from('email_unsubscribe_tokens').select('token,used_at').eq('email',email).maybeSingle();
  if(tokenError || tokenRow?.used_at)throw new Error('Recipient unavailable');
  if(!tokenRow){
   const token=[...crypto.getRandomValues(new Uint8Array(32))].map(b=>b.toString(16).padStart(2,'0')).join('');
   const {error}=await db.from('email_unsubscribe_tokens').upsert({email,token},{onConflict:'email',ignoreDuplicates:true});
   if(error)throw new Error('Token unavailable');
  }
  const {data:token,error}=await db.from('email_unsubscribe_tokens').select('token,used_at').eq('email',email).single();
  if(error || token.used_at)throw new Error('Recipient unavailable');
  const {TEMPLATES}=await import('@/lib/email-templates/registry');
  const template=TEMPLATES['saved-drug-price-change'];
  if(!template)throw new Error('Template unavailable');
  const React=await import('react'),{render}=await import('@react-email/render');
  const element=React.createElement(template.component,comparison);
  const [html,text]=await Promise.all([render(element),render(element,{plainText:true})]);
  // Re-check private account entitlement and preference immediately before atomic handoff.
  await verifiedEmailEvent(db,event.id,process.env['STRIPE_SECRET_KEY']);
  const {data:result,error:queueError}=await db.rpc('nadac_enqueue_saved_alert',{p_event:event.id,p_payload:{
   message_id:event.id,idempotency_key:`saved-drug:${event.id}`,to:email,from:'NADAC Price Finder <noreply@nadaclookup.com>',sender_domain:'notify.nadaclookup.com',
   subject:typeof template.subject==='function'?template.subject(comparison):template.subject,html,text,purpose:'transactional',label:'saved-drug-price-change',unsubscribe_token:token.token,queued_at:new Date().toISOString(),saved_drug_event_id:event.id,
  }});
  if(queueError)throw new Error('Queue blocked');
  return Response.json(result);
 }catch{return Response.json({error:'Email blocked: accuracy, preferences or eligibility could not be verified'},{status:409});}
}}});