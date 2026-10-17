import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import { setResponseHeader } from '@tanstack/react-start/server';
import type { Database } from '@/integrations/supabase/types';
import { publicationSchema } from './weekly-publication';

export const getWeeklyPublication = createServerFn({ method: 'GET' }).handler(async () => {
  setResponseHeader('Cache-Control','no-store');
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_PUBLISHABLE_KEY'] ?? process.env['SUPABASE_ANON_KEY'];
  if (!url || !key) throw new Error('Pricing status unavailable');
  const client = createClient<Database>(url,key,{ auth: { persistSession:false,autoRefreshToken:false }, global:{fetch:(input,init)=>{
    const headers = new Headers(init?.headers); if(key.startsWith('sb_') && headers.get('Authorization')===`Bearer ${key}`) headers.delete('Authorization'); headers.set('apikey',key); return fetch(input,{...init,headers});
  }}});
  const {data,error} = await client.rpc('nadac_public_status');
  if (error) throw new Error('Pricing status unavailable');
  return publicationSchema.parse(data);
});
