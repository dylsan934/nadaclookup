import { useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { getWeeklyAdmin, weeklyAdminAction } from '@/lib/weekly-admin.functions';
import { previewSavedAlerts } from '@/lib/saved-alerts.functions';
import { parseRelease } from '@/lib/weekly-publication';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Loader2, RotateCcw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export function WeeklyRunPanel() {
 const read=useServerFn(getWeeklyAdmin), action=useServerFn(weeklyAdminAction);
 const queryClient=useQueryClient();
 const preview=useServerFn(previewSavedAlerts);
 const [alerts,setAlerts]=useState<Awaited<ReturnType<typeof previewSavedAlerts>> | null>(null);
 const [data,setData]=useState<Awaited<ReturnType<typeof getWeeklyAdmin>> | null>(null);
 const [date,setDate]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const refresh=async()=>{try {setData(await read());}catch {setError('Unable to load weekly run history.');}};
 useEffect(()=>{void refresh();},[]);
 const finish=async(runId:string)=>{
  for(const step of ['validate','compare','prepare'] as const) await action({data:{action:step,runId}});
  await queryClient.invalidateQueries({queryKey:['weekly-publication']});
 };
 const upload=async(file:File)=>{
  setBusy(true);setError('');
  try {
   const csv=await file.text(),records=parseRelease(csv,date);
   const checksum=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(csv)))].map(n=>n.toString(16).padStart(2,'0')).join('');
   const previousDate=new Date(`${date}T00:00:00Z`);previousDate.setUTCDate(previousDate.getUTCDate()-7);
   const previous=data?.runs.find(r=>r.source_date===previousDate.toISOString().slice(0,10));
   const baseline=!data?.runs.length;
   const {runId}=await action({data:{action:'begin',sourceDate:date,checksum,count:records.length,previousRunId:previous?.id ?? null,baseline}});
   for(let i=0;i<records.length;i+=500)await action({data:{action:'stage',runId,records:records.slice(i,i+500)}});
   await action({data:{action:'validate',runId}});
  }catch(e){setError(e instanceof Error ? e.message:'Weekly repair failed.');}finally{await refresh();setBusy(false);}
 };
 const retry=async(runId:string)=>{setBusy(true);setError('');try{const run=data?.runs.find(r=>r.id===runId);if(!run)return;if(run.validation_status!=='completed'){await action({data:{action:'download',sourceDate:run.source_date}});}else{await finish(runId);}}catch(e){setError(e instanceof Error ? e.message:'Retry failed.');}finally{await refresh();setBusy(false);}};
 return <section className="mb-8 border-y border-border py-6 space-y-4">
  <h2 className="text-xl font-semibold">Weekly data runs</h2>
  {data?.runs.filter(r=>r.status==='failed').map(r=><p role="alert" className="text-sm text-destructive" key={`notice-${r.id}`}>{r.source_date} · {r.failure_stage ?? 'publication'} failed · {r.failure_reason} · Retry {r.validation_status==='completed'?'comparison and preview':'download and validation'}.</p>)}
  {data?.invariant && <details className="text-sm"><summary className="cursor-pointer font-medium">Public release consistency</summary><pre className="mt-2 overflow-x-auto text-xs">{JSON.stringify(data.invariant,null,2)}</pre></details>}
  <Button variant="outline" disabled={busy} onClick={async()=>{setBusy(true);setError('');try{setAlerts(await preview());}catch{setError('Saved-drug alert preview unavailable.');}finally{setBusy(false);}}}>Preview saved-drug alerts</Button>
  {alerts && <div className="text-sm space-y-2"><p>Private preview only · no emails queued · {alerts.rows.length} saved drugs checked</p>{alerts.rows.map(a=><p key={a.savedDrugId}>{a.drugName ?? a.ndc} · {a.ndc} · {a.previousDate} → {a.currentDate} · {a.reason ?? 'Verified change'}{a.oldPrice && a.newPrice ? ` · $${a.oldPrice} → $${a.newPrice}`:''}</p>)}</div>}
  <p className="text-sm text-muted-foreground">Historical repair · preview-only digest preparations · no emails sent</p>
  <div className="flex flex-wrap items-end gap-3">
   <label className="text-sm">CMS publication date<Input type="date" value={date} onChange={e=>setDate(e.target.value)} disabled={busy}/></label>
   <Button variant="outline" disabled={busy || !date || !data} onClick={async()=>{setBusy(true);setError('');try{await action({data:{action:'download',sourceDate:date}});}catch(e){setError(e instanceof Error ? e.message:'CMS validation failed.');}finally{await refresh();setBusy(false);}}}>Validate CMS release</Button>
   <label className="text-sm">CMS release CSV<Input type="file" accept=".csv,text/csv" aria-label="CMS release CSV" disabled={busy || !date || !data} onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file);e.target.value='';}}/></label>
   {busy && <Loader2 className="h-5 w-5 animate-spin" aria-label="Processing weekly run"/>}
  </div>
  {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
  <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Release / Status</TableHead><TableHead>Records / Rejected</TableHead><TableHead>Download / Validation / Prices / Drug pages / Movers / Homepage / Preview / Publication</TableHead><TableHead>Published UTC</TableHead><TableHead>Failure</TableHead><TableHead>Retries</TableHead></TableRow></TableHeader><TableBody>
   {data?.runs.map(r=><TableRow key={r.id}><TableCell>{r.source_date}{r.baseline ? ' (baseline)':''}<span className="block text-xs">{r.status}</span></TableCell><TableCell>{r.record_count.toLocaleString()} / {r.artifact_verified?r.expected_count.toLocaleString():'Unknown'} · {r.rejected_count} rejected</TableCell><TableCell className="text-xs">{[r.download_status,r.validation_status,r.current_price_status,r.drug_page_status,r.movers_status,r.homepage_status,r.digest_status,r.freshness_status].join(' / ')}</TableCell><TableCell>{r.published_at ? new Date(r.published_at).toLocaleString('en-US',{timeZone:'UTC'}):'Not published'}</TableCell><TableCell>{r.failure_reason ?? '—'}</TableCell><TableCell>{r.retry_count}{r.status!=='completed' && <Button size="icon" variant="outline" title="Retry without publishing" aria-label={`Retry ${r.source_date}`} disabled={busy} onClick={()=>void retry(r.id)}><RotateCcw className="h-4 w-4"/></Button>}</TableCell></TableRow>)}
  </TableBody></Table></div>
  <details><summary className="cursor-pointer text-sm font-medium">Stage history</summary>{data?.attempts.map(a=><p className="text-xs mt-2" key={a.id}>{data.runs.find(r=>r.id===a.run_id)?.source_date} · {a.stage} · {a.outcome} · {a.occurred_at} · {a.record_count} records · retry {a.retry_count}{a.reason?` · ${a.reason}`:''}</p>)}</details>
  {data?.runs.filter(r=>!r.baseline).map(r=><details key={r.id} className="border-b border-border pb-3"><summary className="cursor-pointer text-sm font-medium">{r.source_date} · {r.total_changed} changed · {r.added_count} added · {r.removed_count} removed · {r.non_comparable_count} non-comparable · digest preview</summary><div className="mt-3 space-y-2 text-sm"><p>Rows: {JSON.stringify({increases:r.top_increases,decreases:r.top_decreases})}</p><p>No historical preparations can be sent.</p><ul>{data.preparations.filter(p=>p.run_id===r.id).map(p=><li key={p.user_id}>{data.recipients.find(x=>x.userId===p.user_id)?.email ?? 'Email unavailable'} · {p.eligibility} · preview only</li>)}</ul></div></details>)}
 </section>;
}
