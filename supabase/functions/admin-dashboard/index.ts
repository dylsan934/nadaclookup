import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authorization
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

    // Create client with user's token to verify identity
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

    const userId = claimsData.claims.sub;

    // Create service role client for admin operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Server-side admin check - this is the REAL authorization
    const { data: roleData, error: roleError } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
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
      // Get statistics
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
      
      const users = await getUsers(adminClient, search, page, limit);
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
  // Get total users from auth
  const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers();
  
  if (authError) {
    console.error('Error fetching auth users:', authError);
    throw authError;
  }

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

  // Get total saved drugs
  const { count: totalSavedDrugs } = await adminClient
    .from('saved_drugs')
    .select('*', { count: 'exact', head: true });

  // Get total price alerts sent
  const { count: totalAlertsSent } = await adminClient
    .from('price_alerts')
    .select('*', { count: 'exact', head: true });

  // Count users with roles
  const { data: userRoles } = await adminClient
    .from('user_roles')
    .select('user_id, role');

  const adminCount = (userRoles as { user_id: string; role: string }[] | null)?.filter(
    r => r.role === 'admin'
  ).length || 0;

  return {
    totalUsers,
    newUsersLast7Days,
    newUsersLast30Days,
    totalSavedDrugs: totalSavedDrugs || 0,
    totalAlertsSent: totalAlertsSent || 0,
    adminCount,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getUsers(
  adminClient: SupabaseClient<any, any, any>,
  search: string,
  page: number,
  limit: number
) {
  // Get all users from auth
  const { data: authData, error: authError } = await adminClient.auth.admin.listUsers();
  
  if (authError) {
    console.error('Error fetching users:', authError);
    throw authError;
  }

  type AuthUser = {
    id: string;
    email?: string;
    created_at: string;
    last_sign_in_at?: string;
    email_confirmed_at?: string;
  };

  let users: AuthUser[] = authData?.users || [];

  // Filter by search term (email)
  if (search) {
    const searchLower = search.toLowerCase();
    users = users.filter(u => 
      u.email?.toLowerCase().includes(searchLower)
    );
  }

  // Sort by created_at descending
  users.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const totalCount = users.length;
  const offset = (page - 1) * limit;
  const paginatedUsers = users.slice(offset, offset + limit);

  // Get profiles for these users
  const userIds = paginatedUsers.map(u => u.id);
  
  const { data: profiles } = await adminClient
    .from('profiles')
    .select('user_id, lifetime_saves_count, created_at, updated_at')
    .in('user_id', userIds);

  const { data: savedDrugsCounts } = await adminClient
    .from('saved_drugs')
    .select('user_id')
    .in('user_id', userIds);

  const { data: userRoles } = await adminClient
    .from('user_roles')
    .select('user_id, role')
    .in('user_id', userIds);

  type SavedDrug = { user_id: string };
  type UserRole = { user_id: string; role: string };
  type Profile = { user_id: string; lifetime_saves_count: number; created_at: string; updated_at: string };

  // Count saved drugs per user
  const savedDrugsMap: Record<string, number> = {};
  (savedDrugsCounts as SavedDrug[] | null)?.forEach(sd => {
    savedDrugsMap[sd.user_id] = (savedDrugsMap[sd.user_id] || 0) + 1;
  });

  // Map roles
  const rolesMap: Record<string, string[]> = {};
  (userRoles as UserRole[] | null)?.forEach(ur => {
    if (!rolesMap[ur.user_id]) rolesMap[ur.user_id] = [];
    rolesMap[ur.user_id].push(ur.role);
  });

  // Map profiles
  const profilesMap: Record<string, Profile> = {};
  (profiles as Profile[] | null)?.forEach(p => {
    profilesMap[p.user_id] = p;
  });

  const enrichedUsers = paginatedUsers.map(u => ({
    id: u.id,
    email: u.email,
    createdAt: u.created_at,
    lastSignInAt: u.last_sign_in_at,
    emailConfirmedAt: u.email_confirmed_at,
    savedDrugsCount: savedDrugsMap[u.id] || 0,
    lifetimeSavesCount: profilesMap[u.id]?.lifetime_saves_count || 0,
    roles: rolesMap[u.id] || [],
    isAdmin: rolesMap[u.id]?.includes('admin') || false,
  }));

  return {
    users: enrichedUsers,
    totalCount,
    page,
    limit,
    totalPages: Math.ceil(totalCount / limit),
  };
}
