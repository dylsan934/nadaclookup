import { createFileRoute, redirect, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { pageHead } from '@/lib/seo';

export const Route = createFileRoute('/.lovable/oauth/consent')({
  ssr: false,
  head: () => pageHead({ title: 'Connect Your Assistant — NADAC Price Finder', description: 'Approve or decline secure assistant access to your NADAC Price Finder account.', path: '/.lovable/oauth/consent', robots: 'noindex, nofollow' }),
  validateSearch: (s: Record<string, unknown>) => ({ authorization_id: typeof s['authorization_id'] === 'string' ? s['authorization_id'] : '' }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error('This connection request is missing its authorization ID. Start the connection again.');
    const { data, error } = await supabase.auth.getSession();
    if (error) throw new Error('Unable to check your account. Please try again.');
    if (!data.session) {
      const next = location.pathname + location.searchStr + location.hash;
      throw redirect({ href: `/auth?next=${encodeURIComponent(next)}` });
    }
  },
  loader: async ({ location }) => {
    const id = new URLSearchParams(location.searchStr).get('authorization_id');
    if (!id) throw new Error('Missing connection request.');
    const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(id);
    if (error) throw new Error('This request may have expired or been cancelled. Start the connection again.');
    const immediate = data && 'redirect_url' in data ? data.redirect_url : undefined;
    if (immediate && !('client' in data)) throw redirect({ href: immediate });
    const session = await supabase.auth.getSession();
    return { details: data, account: session.data.session?.user.email ?? 'Your account' };
  },
  pendingComponent: () => <main className="min-h-screen grid place-items-center bg-background text-foreground">Loading connection request…</main>,
  errorComponent: ({ error }) => <main className="min-h-screen grid place-items-center bg-background px-4"><section className="max-w-md space-y-4"><h1 className="text-2xl font-semibold">Connection unavailable</h1><p role="alert" className="text-muted-foreground">{error instanceof Error ? error.message : 'Unable to load this connection request.'}</p><Link to="/" className="text-primary underline">Return to NADAC Lookup</Link></section></main>,
  component: Consent,
});

function Consent() {
  const { details, account } = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!details || !('client' in details)) return <main className="p-8">Connection request unavailable.</main>;
  const client = details.client.name ?? 'Your assistant';
  const scopes = details.scope?.split(' ').filter(Boolean) ?? [];
  async function decide(approve: boolean) {
    setBusy(true); setError('');
    try {
      const result = approve
        ? await supabase.auth.oauth.approveAuthorization(authorization_id)
        : await supabase.auth.oauth.denyAuthorization(authorization_id);
      if (result.error) throw new Error(approve ? 'Unable to approve this connection. Please try again.' : 'Unable to cancel this connection. Please try again.');
      const target = result.data?.redirect_url;
      if (!target) throw new Error('No return address was provided. Start the connection again.');
      window.location.assign(target);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Connection failed. Please try again.');
      setBusy(false);
    }
  }
  return <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-10">
    <section className="w-full max-w-lg space-y-6">
      <p className="text-primary font-semibold">NADAC Price Finder</p>
      <h1 className="text-2xl font-semibold">Connect {client} to NADAC Price Finder</h1>
      <p className="text-muted-foreground">This lets {client} use this app as you.</p>
      <div className="border-y border-border py-4 space-y-2 text-sm"><p>Account: {account}</p><p className="break-all">Return address: {details.redirect_uri}</p><Button variant="link" disabled={busy} onClick={async () => { setBusy(true); const result = await supabase.auth.signOut(); if (result.error) { setError('Unable to switch accounts. Please try again.'); setBusy(false); return; } window.location.reload(); }}>Switch account</Button></div>
      <ul className="list-disc pl-5 space-y-2 text-sm">
        <li>Look up NADAC prices by exact NDC.</li><li>Read drugs in your watchlist and their alert settings.</li>
        {scopes.map(scope => <li key={scope}>{scope === 'openid' ? 'Confirm your identity' : scope === 'email' ? 'Share your email address' : scope === 'profile' ? 'Share your basic profile' : `Additional permission requested: ${scope}`}</li>)}
      </ul>
      <p className="text-sm text-muted-foreground">Your existing account permissions still apply. This connection cannot send emails or change saved drugs.</p>
      {error && <p role="alert" className="text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-3"><Button disabled={busy} onClick={() => decide(true)}>Approve connection</Button><Button disabled={busy} variant="outline" onClick={() => decide(false)}>Cancel connection</Button></div>
    </section>
  </main>;
}