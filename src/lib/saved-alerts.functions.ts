import { createServerFn } from '@tanstack/react-start';
import { setResponseHeader } from '@tanstack/react-start/server';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export const previewSavedAlerts=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async({context})=>{
 setResponseHeader('Cache-Control','private, no-store');
 const {data:allowed,error}=await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'});
 if(error || !allowed)throw new Error('Forbidden');
 const {supabaseAdmin:db}=await import('@/integrations/supabase/client.server');
 const {readSavedAlert}=await import('./saved-alerts.server');
 const {data:saves,error:readError}=await db.from('saved_drugs').select('id').order('id').limit(100);
 if(readError)throw new Error('Watchlist preview unavailable');
 const rows=await Promise.all((saves ?? []).map(async s=>{
  const v=await readSavedAlert(db,s.id);
  return {savedDrugId:v.savedDrugId,ndc:v.ndc,drugName:v.drugName,previousDate:v.previousDate,currentDate:v.currentDate,oldPrice:v.oldPrice,newPrice:v.newPrice,reason:v.reason};
 }));
 return {rows,previewOnly:true};
});