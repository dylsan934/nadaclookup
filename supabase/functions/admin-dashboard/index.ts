import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adminUserId = claimsData.claims.sub;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: roleData, error: roleError } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', adminUserId)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'stats';

    if (action === 'stats') {
      const stats = await getStats(adminClient);
      return new Response(
        JSON.stringify(stats),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'users') {
      const search = url.searchParams.get('search') || '';
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const filter = url.searchParams.get('filter') || 'all';
      const sort = url.searchParams.get('sort') || 'createdAt';
      const order = (url.searchParams.get('order') || 'desc') as 'asc' | 'desc';

      const users = await getUsers(adminClient, search, page, limit, filter, sort, order);
      return new Response(
        JSON.stringify(users),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Admin dashboard error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getStats(adminClient: SupabaseClient<any, any, any>) {
  const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers();
  if (authError) throw authError;

  const totalUsers = authUsers?.users?.length || 0;
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const newUsersLast7Days = authUsers?.users?.filter(
    (u: { created_at: string }) => new Date(u.created_at) >= sevenDaysAgo
  ).length || 0;

  const newUsersLast30Days = authUsers?.users?.filter(
    (u: { created_at: string }) => new Date(u.created_at) >= thirtyDaysAgo
  ).length || 0;

  const { count: totalSavedDrugs } = await adminClient
    .from('saved_drugs')
    .select('*', { count: 'exact', head: true });

  const { count: totalAlertsSent } = await adminClient
    .from('price_alerts')
    .select('*', { count: 'exact', head: true });

  const { data: userRoles } = await adminClient
    .from('user_roles')
    .select('user_id, role');

  const adminCount = (userRoles as { user_id: string; role: string }[] | null)?.filter(
    r => r.role === 'admin'
  ).length || 0;

  // Active trials from profiles
  const nowIso = new Date().toISOString();
  const { count: activeTrials } = await adminClient
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gt('trial_ends_at', nowIso);

  // Users who have ever been granted a trial
  const { count: everTrialed } = await adminClient
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .not('trial_granted_by', 'is', null);

  // Stripe MRR + Pro count + Stripe trials
  let activeProCount = 0;
  let mrrCents = 0;
  let stripeActiveTrials = 0;
  const proEmails = new Set<string>();
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (stripeKey) {
    try {
      const stripe = new Stripe(stripeKey, { apiVersion: '2025-08-27.basil' });
      for (const status of ['active', 'trialing'] as const) {
        let hasMore = true;
        let startingAfter: string | undefined = undefined;
        while (hasMore) {
          const res: Stripe.Response<Stripe.ApiList<Stripe.Subscription>> = await stripe.subscriptions.list({
            status,
            limit: 100,
            starting_after: startingAfter,
            expand: ['data.customer'],
          });
          for (const sub of res.data) {
            if (status === 'active') {
              activeProCount += 1;
              const amount = sub.items.data[0]?.price?.unit_amount || 0;
              mrrCents += amount;
            } else {
              stripeActiveTrials += 1;
            }
            const cust = sub.customer as Stripe.Customer | Stripe.DeletedCustomer;
            if (cust && !('deleted' in cust) && cust.email && status === 'active') {
              proEmails.add(cust.email.toLowerCase());
            }
          }
          hasMore = res.has_more;
          startingAfter = res.data.length ? res.data[res.data.length - 1].id : undefined;
          if (!startingAfter) break;
        }
      }
    } catch (e) {
      console.error('Stripe stats error:', e);
    }
  }

  // Trial → Paid conversion: # of past-trialed users who now have an active sub
  let trialConverted = 0;
  if (everTrialed && proEmails.size > 0) {
    const { data: trialedProfiles } = await adminClient
      .from('profiles')
      .select('user_id')
      .not('trial_granted_by', 'is', null);
    const trialedIds = new Set((trialedProfiles || []).map((p: { user_id: string }) => p.user_id));
    const emailByUserId = new Map<string, string>();
    authUsers?.users?.forEach((u: { id: string; email?: string }) => {
      if (u.email) emailByUserId.set(u.id, u.email.toLowerCase());
    });
    for (const id of trialedIds) {
      const e = emailByUserId.get(id);
      if (e && proEmails.has(e)) trialConverted += 1;
    }
  }
  const trialConversionRate = everTrialed && everTrialed > 0
    ? Math.round((trialConverted / everTrialed) * 1000) / 10
    : 0;

  return {
    totalUsers,
    newUsersLast7Days,
    newUsersLast30Days,
    totalSavedDrugs: totalSavedDrugs || 0,
    totalAlertsSent: totalAlertsSent || 0,
    adminCount,
    activeProCount,
    mrrCents,
    activeTrials: activeTrials || 0,
    stripeActiveTrials,
    trialConversionRate,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getUsers(
  adminClient: SupabaseClient<any, any, any>,
  search: string,
  page: number,
  limit: number,
  filter: string,
  sort: string,
  order: 'asc' | 'desc',
) {
  const { data: authData, error: authError } = await adminClient.auth.admin.listUsers();
  if (authError) throw authError;

  type AuthUser = {
    id: string;
    email?: string;
    created_at: string;
    last_sign_in_at?: string;
    email_confirmed_at?: string;
  };

  let users: AuthUser[] = authData?.users || [];

  if (search) {
    const searchLower = search.toLowerCase();
    users = users.filter(u => u.email?.toLowerCase().includes(searchLower));
  }

  const allUserIds = users.map(u => u.id);
  const allEmails = users.map(u => u.email).filter(Boolean) as string[];

  // Fetch supporting data for ALL filtered users (so filter chips work across pages)
  const [profilesRes, savedDrugsRes, alertsRes, rolesRes] = await Promise.all([
    adminClient
      .from('profiles')
      .select('user_id, lifetime_saves_count, trial_ends_at, trial_granted_by, notify_weekly_movers, notify_saved_drugs')
      .in('user_id', allUserIds),
    adminClient
      .from('saved_drugs')
      .select('user_id, created_at')
      .in('user_id', allUserIds),
    adminClient
      .from('price_alerts')
      .select('user_id, sent_at')
      .in('user_id', allUserIds),
    adminClient
      .from('user_roles')
      .select('user_id, role')
      .in('user_id', allUserIds),
  ]);

  type Profile = {
    user_id: string;
    lifetime_saves_count: number;
    trial_ends_at: string | null;
    trial_granted_by: string | null;
    notify_weekly_movers: boolean;
    notify_saved_drugs: boolean;
  };

  const profilesMap = new Map<string, Profile>();
  (profilesRes.data as Profile[] | null)?.forEach(p => profilesMap.set(p.user_id, p));

  const savedDrugsMap = new Map<string, { count: number; last: string | null }>();
  (savedDrugsRes.data as { user_id: string; created_at: string }[] | null)?.forEach(sd => {
    const cur = savedDrugsMap.get(sd.user_id) || { count: 0, last: null };
    cur.count += 1;
    if (!cur.last || sd.created_at > cur.last) cur.last = sd.created_at;
    savedDrugsMap.set(sd.user_id, cur);
  });

  const alertsMap = new Map<string, { count: number; last: string | null }>();
  (alertsRes.data as { user_id: string; sent_at: string }[] | null)?.forEach(a => {
    const cur = alertsMap.get(a.user_id) || { count: 0, last: null };
    cur.count += 1;
    if (!cur.last || a.sent_at > cur.last) cur.last = a.sent_at;
    alertsMap.set(a.user_id, cur);
  });

  const rolesMap = new Map<string, string[]>();
  (rolesRes.data as { user_id: string; role: string }[] | null)?.forEach(ur => {
    const cur = rolesMap.get(ur.user_id) || [];
    cur.push(ur.role);
    rolesMap.set(ur.user_id, cur);
  });

  // Stripe lookup for all emails: active (Pro) + trialing
  const proSet = new Set<string>();
  const subEndByEmail = new Map<string, string | null>();
  const stripeTrialByEmail = new Map<string, string | null>();
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (stripeKey && allEmails.length > 0) {
    try {
      const stripe = new Stripe(stripeKey, { apiVersion: '2025-08-27.basil' });
      for (const status of ['active', 'trialing'] as const) {
        let hasMore = true;
        let startingAfter: string | undefined = undefined;
        while (hasMore) {
          const res: Stripe.Response<Stripe.ApiList<Stripe.Subscription>> = await stripe.subscriptions.list({
            status,
            limit: 100,
            starting_after: startingAfter,
            expand: ['data.customer'],
          });
          for (const sub of res.data) {
            const cust = sub.customer as Stripe.Customer | Stripe.DeletedCustomer;
            if (!cust || ('deleted' in cust) || !cust.email) continue;
            const e = cust.email.toLowerCase();
            if (status === 'active') {
              proSet.add(e);
              let endIso: string | null = null;
              if (sub.current_period_end) {
                const ts = typeof sub.current_period_end === 'number'
                  ? sub.current_period_end * 1000
                  : new Date(sub.current_period_end).getTime();
                endIso = new Date(ts).toISOString();
              }
              subEndByEmail.set(e, endIso);
            } else {
              let trialEndIso: string | null = null;
              if (sub.trial_end) {
                const ts = typeof sub.trial_end === 'number'
                  ? sub.trial_end * 1000
                  : new Date(sub.trial_end).getTime();
                trialEndIso = new Date(ts).toISOString();
              }
              stripeTrialByEmail.set(e, trialEndIso);
            }
          }
          hasMore = res.has_more;
          startingAfter = res.data.length ? res.data[res.data.length - 1].id : undefined;
          if (!startingAfter) break;
        }
      }
    } catch (e) {
      console.error('Stripe lookup error:', e);
    }
  }

  const now = new Date();

  // Enrich
  const enrichedAll = users.map(u => {
    const profile = profilesMap.get(u.id);
    const saved = savedDrugsMap.get(u.id);
    const alerts = alertsMap.get(u.id);
    const emailLower = u.email?.toLowerCase();
    const isPro = emailLower ? proSet.has(emailLower) : false;
    const subEnd = emailLower ? (subEndByEmail.get(emailLower) || null) : null;
    const trialEndsAt = profile?.trial_ends_at || null;
    const trialActive = !!trialEndsAt && new Date(trialEndsAt) > now;

    const candidates = [
      u.last_sign_in_at || null,
      saved?.last || null,
      alerts?.last || null,
    ].filter(Boolean) as string[];
    const lastActivityAt = candidates.length
      ? candidates.reduce((a, b) => (a > b ? a : b))
      : null;

    const isAdmin = (rolesMap.get(u.id) || []).includes('admin');

    return {
      id: u.id,
      email: u.email,
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at || null,
      emailConfirmedAt: u.email_confirmed_at || null,
      savedDrugsCount: saved?.count || 0,
      lifetimeSavesCount: profile?.lifetime_saves_count || 0,
      alertsReceivedCount: alerts?.count || 0,
      lastActivityAt,
      notifyWeeklyMovers: profile?.notify_weekly_movers ?? true,
      notifySavedDrugs: profile?.notify_saved_drugs ?? true,
      roles: rolesMap.get(u.id) || [],
      isAdmin,
      trialEndsAt,
      isTrialActive: trialActive,
      isProMember: isPro,
      subscriptionEnd: subEnd,
    };
  });

  // Apply filter
  let filtered = enrichedAll;
  switch (filter) {
    case 'pro':
      filtered = enrichedAll.filter(u => u.isProMember);
      break;
    case 'trial':
      filtered = enrichedAll.filter(u => u.isTrialActive);
      break;
    case 'free':
      filtered = enrichedAll.filter(u => !u.isProMember && !u.isTrialActive);
      break;
    case 'unverified':
      filtered = enrichedAll.filter(u => !u.emailConfirmedAt);
      break;
    case 'admin':
      filtered = enrichedAll.filter(u => u.isAdmin);
      break;
  }

  // Sort
  const sortKey = sort as keyof typeof enrichedAll[number];
  filtered.sort((a, b) => {
    const av = (a as Record<string, unknown>)[sortKey as string];
    const bv = (b as Record<string, unknown>)[sortKey as string];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === 'number' && typeof bv === 'number') {
      return order === 'asc' ? av - bv : bv - av;
    }
    const as = String(av);
    const bs = String(bv);
    return order === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as);
  });

  const totalCount = filtered.length;
  const offset = (page - 1) * limit;
  const paginated = filtered.slice(offset, offset + limit);

  return {
    users: paginated,
    totalCount,
    page,
    limit,
    totalPages: Math.ceil(totalCount / limit),
  };
}
