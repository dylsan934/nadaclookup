import { useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { getWeeklyAdmin, weeklyAdminAction } from '@/lib/weekly-admin.functions';
import { parseRelease } from '@/lib/weekly-publication';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Loader2, RotateCcw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export function WeeklyRunPanel() {
 const read=useServerFn(getWeeklyAdmin), action=useServerFn(weeklyAdminAction);
 const queryClient=useQueryClient();
 const [data,setData]=useState<Awaited<ReturnType<typeof getWeeklyAdmin>> | null>(null);
 const [date,setDate]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const refresh=async()=>{try {setData(await read());}catch {setError('Unable to load weekly run history.');}};
 useEffect(()=>{void refresh();},[]);
 const finish=async(runId:string)=>{
  for(const step of ['validate','compare','prepare','finalize'] as const) await action({data:{action:step,runId}});
  await queryClient.invalidateQueries({queryKey:['weekly-publication']});
 };
 const upload=async(file:File)=>{
  setBusy(true);setError('');
  try {
   const csv=await file.text(),records=parseRelease(csv,date);
   const checksum=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(csv)))].map(n=>n.toString(16).padStart(2,'0')).join('');
   const previousDate=new Date(`${date}T00:00:00Z`);previousDate.setUTCDate(previousDate.getUTCDate()-7);
   const previous=data?.runs.find(r=>r.source_date===previousDate.toISOString().slice(0,10) && r.status==='completed');
   const baseline=!data?.runs.length;
   if(!previous && !baseline)throw new Error('Upload the preceding weekly release first.');
   const {runId}=await action({data:{action:'begin',sourceDate:date,checksum,count:records.length,previousRunId:previous?.id ?? null,baseline}});
   for(let i=0;i<records.length;i+=500)await action({data:{action:'stage',runId,records:records.slice(i,i+500)}});
   await finish(runId);
  }catch(e){setError(e instanceof Error ? e.message:'Weekly repair failed.');}finally{await refresh();setBusy(false);}
 };
 const retry=async(runId:string)=>{setBusy(true);setError('');try{await finish(runId);}catch(e){setError(e instanceof Error ? e.message:'Retry failed.');}finally{await refresh();setBusy(false);}};
 return <section className="mb-8 border-y border-border py-6 space-y-4">
  <h2 className="text-xl font-semibold">Weekly data runs</h2>
  <p className="text-sm text-muted-foreground">Historical repair · preview-only digest preparations · no emails sent</p>
  <div className="flex flex-wrap items-end gap-3">
   <label className="text-sm">CMS publication date<Input type="date" value={date} onChange={e=>setDate(e.target.value)} disabled={busy}/></label>
   <label className="text-sm">CMS release CSV<Input type="file" accept=".csv,text/csv" aria-label="CMS release CSV" disabled={busy || !date || !data} onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file);e.target.value='';}}/></label>
   {busy && <Loader2 className="h-5 w-5 animate-spin" aria-label="Processing weekly run"/>}
  </div>
  {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
  <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Release</TableHead><TableHead>Records</TableHead><TableHead>Search / Movers / Homepage / Digest / Freshness</TableHead><TableHead>Completed UTC</TableHead><TableHead>Failure</TableHead><TableHead>Retry</TableHead></TableRow></TableHeader><TableBody>
   {data?.runs.map(r=><TableRow key={r.id}><TableCell>{r.source_date}{r.baseline ? ' (baseline)':''}</TableCell><TableCell>{r.record_count.toLocaleString()} / {r.expected_count.toLocaleString()}</TableCell><TableCell className="text-xs">{[r.search_status,r.movers_status,r.homepage_status,r.digest_status,r.freshness_status].join(' / ')}</TableCell><TableCell>{r.completed_at ? new Date(r.completed_at).toLocaleString('en-US',{timeZone:'UTC'}):'Pending'}</TableCell><TableCell>{r.failure_reason ?? '—'}</TableCell><TableCell>{r.status!=='completed' && <Button size="icon" variant="outline" title="Retry incomplete stages" aria-label={`Retry ${r.source_date}`} disabled={busy} onClick={()=>void retry(r.id)}><RotateCcw className="h-4 w-4"/></Button>}</TableCell></TableRow>)}
  </TableBody></Table></div>
  {data?.runs.filter(r=>!r.baseline).map(r=><details key={r.id} className="border-b border-border pb-3"><summary className="cursor-pointer text-sm font-medium">{r.source_date} · {r.total_changed} changed · {r.added_count} added · {r.removed_count} removed · {r.non_comparable_count} non-comparable · digest preview</summary><div className="mt-3 space-y-2 text-sm"><p>Rows: {JSON.stringify({increases:r.top_increases,decreases:r.top_decreases})}</p><p>No historical preparations can be sent.</p><ul>{data.preparations.filter(p=>p.run_id===r.id).map(p=><li key={p.user_id}>{data.recipients.find(x=>x.userId===p.user_id)?.email ?? 'Email unavailable'} · {p.eligibility} · preview only</li>)}</ul></div></details>)}
 </section>;
}
