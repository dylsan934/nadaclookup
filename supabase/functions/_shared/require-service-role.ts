// Shared auth helper: require a service_role JWT in the Authorization header.
// Returns null if authorized, or a Response (401/403) to return immediately.

function parseJwtClaims(token: string): Record<string, unknown> | null {
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    const payload = parts[1]
      .replaceAll('-', '+')
      .replaceAll('_', '/')
      .padEnd(Math.ceil(parts[1].length / 4) * 4, '=')
    return JSON.parse(atob(payload)) as Record<string, unknown>
  } catch {
    return null
  }
}

export function requireServiceRole(
  req: Request,
  corsHeaders: Record<string, string> = {}
): Response | null {
  // Allow scheduled cron jobs to authenticate with a shared secret header.
  const cronSecret = Deno.env.get('CRON_SECRET') || ''
  const cronHeader = req.headers.get('x-cron-secret') || ''
  if (cronSecret && cronHeader && cronHeader === cronSecret) return null

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const token = authHeader.slice('Bearer '.length).trim()

  // Accept the new sb_secret_* / sb_publishable_* style service key by constant comparison.
  const serviceKeyEnv = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  if (serviceKeyEnv && token === serviceKeyEnv) return null

  const claims = parseJwtClaims(token)
  if (claims?.role !== 'service_role') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  return null
}
