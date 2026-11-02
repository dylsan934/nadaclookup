import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import { setResponseHeader } from '@tanstack/react-start/server';
import { z } from 'zod';
import type { Database } from '@/integrations/supabase/types';
import { publishedDrugSchema } from './published-drug';
import { slugToSearchTerm, drugNameToSlug, drugNameRoot } from './drug-slug';

export const getDrugPageSnapshot = createServerFn({method:'GET'}).inputValidator((input:unknown)=>z.object({slug:z.string().min(1).max(300)}).parse(input)).handler(async({data})=>{
 setResponseHeader('Cache-Control','no-store');
 const url=process.env['SUPABASE_URL'],key=process.env['SUPABASE_PUBLISHABLE_KEY'] ?? process.env['SUPABASE_ANON_KEY'];
 if(!url || !key)throw new Error('Published pricing unavailable');
 const db=createClient<Database>(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>{
  const headers=new Headers(init?.headers);if(key.startsWith('sb_') && headers.get('Authorization')===`Bearer ${key}`)headers.delete('Authorization');headers.set('apikey',key);return fetch(input,{...init,headers});
 }}});
 const term=slugToSearchTerm(data.slug);
 let query=await db.from('nadac_published_drugs').select('*').ilike('drug_name',term).order('effective_date',{ascending:false}).limit(500);
 if(query.error)throw new Error('Published pricing unavailable');
 if(!query.data?.length)query=await db.from('nadac_published_drugs').select('*').ilike('drug_name',`${term}%`).order('effective_date',{ascending:false}).limit(500);
 if(query.error)throw new Error('Published pricing unavailable');
 const matched=z.array(publishedDrugSchema).parse(query.data ?? []);
 const exact=matched.filter(r=>drugNameToSlug(r.drug_name)===data.slug);
 const rows=exact.length ? exact : matched;
 const primary=rows[0];
 if(!primary)return {rows:[],related:[],runId:null,publicationDate:null};
 const cols='drug_name,nadac_per_unit,pricing_unit,effective_date,run_id';
 const root=drugNameRoot(primary.drug_name);
 const responses=await Promise.all([
  db.from('nadac_published_drugs').select(cols).eq('run_id',primary.run_id).ilike('drug_name',`${root}%`).order('effective_date',{ascending:false}).limit(200),
  db.from('nadac_published_drugs').select(cols).eq('run_id',primary.run_id).gt('drug_name',primary.drug_name).order('drug_name').limit(80),
  db.from('nadac_published_drugs').select(cols).eq('run_id',primary.run_id).lt('drug_name',primary.drug_name).order('drug_name',{ascending:false}).limit(80),
 ]);
 const seen=new Set([primary.drug_name]);
 const related=responses.flatMap((response,i)=>{
  if(response.error)throw new Error('Related published pricing unavailable');
  return (response.data ?? []).filter(r=>{if(!r.drug_name || seen.has(r.drug_name))return false;seen.add(r.drug_name);return true;}).slice(0,[5,2,1][i]);
 }).map(r=>z.object({drug_name:z.string(),nadac_per_unit:z.number(),pricing_unit:z.string(),effective_date:z.string()}).parse(r));
 return {rows,related,runId:primary.run_id,publicationDate:primary.publication_date};
});