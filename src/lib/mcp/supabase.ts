import { createClient } from '@supabase/supabase-js';
import { ToolError, type ToolContext } from '@lovable.dev/mcp-js';
import type { Database } from '@/integrations/supabase/types';

function configuredEnv(names: readonly string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}
function projectUrl() {
  const value = configuredEnv(['SUPABASE_URL', 'VITE_SUPABASE_URL']);
  if (!value) throw new ToolError('Drug information is temporarily unavailable.');
  return value;
}
function publishableKey() {
  const value = configuredEnv(['SUPABASE_PUBLISHABLE_KEY', 'VITE_SUPABASE_PUBLISHABLE_KEY']);
  if (value) return value;
  try {
    const keys: unknown = JSON.parse(process.env['SUPABASE_PUBLISHABLE_KEYS'] ?? '{}');
    if (keys && typeof keys === 'object' && !Array.isArray(keys)) {
      const key = Object.values(keys).find((v): v is string => typeof v === 'string' && v.trim().startsWith('sb_publishable_'));
      if (key) return key.trim();
    }
  } catch { /* Try the legacy publishable key. */ }
  const legacy = configuredEnv(['SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY']);
  if (!legacy) throw new ToolError('Drug information is temporarily unavailable.');
  return legacy;
}
export function supabaseForUser(ctx: ToolContext) {
  const token = ctx.getToken();
  if (!ctx.isAuthenticated() || !token) throw new ToolError('Sign in to connect your account.');
  return createClient<Database>(projectUrl(), publishableKey(), {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}