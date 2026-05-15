import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const fmtDate = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    // 1. Latest weekly_movers row
    const { data: row, error: moversErr } = await supabase
      .from('weekly_movers')
      .select('*')
      .gt('total_changed', 0)
      .order('effective_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (moversErr) throw moversErr
    if (!row) {
      return new Response(JSON.stringify({ success: false, reason: 'no_movers' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Find Pro subscribers (active stripe sub OR active trial)
    //    NOTE: this project tracks subscriptions via Stripe; we approximate Pro
    //    by users with an active trial in profiles, and by querying check-subscription
    //    flow is per-user. For a digest, we rely on the trial column + an opt-in flag.
    const nowIso = new Date().toISOString()
    const { data: profiles, error: profErr } = await supabase
      .from('profiles')
      .select('user_id, trial_ends_at, notify_weekly_movers')

    if (profErr) throw profErr

    // 3. Resolve emails for opted-in users via Auth admin API
    const candidateIds = (profiles ?? [])
      .filter((p: any) => p.notify_weekly_movers !== false)
      .map((p: any) => p.user_id)

    if (candidateIds.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0, reason: 'no_recipients' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Page through auth users to collect emails. Caller should also filter to
    // Pro elsewhere; we additionally check check-subscription per user below.
    const userEmails = new Map<string, string>()
    let page = 1
    const perPage = 1000
    while (true) {
      const { data: list, error } = await supabase.auth.admin.listUsers({ page, perPage })
      if (error) throw error
      for (const u of list.users) {
        if (u.email) userEmails.set(u.id, u.email)
      }
      if (list.users.length < perPage) break
      page++
      if (page > 20) break
    }

    // 4. For each candidate, verify Pro status by invoking check-subscription
    //    (cheap; uses Stripe). To keep this function simple and idempotent, we
    //    treat trial_ends_at > now as Pro, and otherwise call check-subscription.
    const recipients: { userId: string; email: string }[] = []
    for (const p of profiles ?? []) {
      if (p.notify_weekly_movers === false) continue
      const email = userEmails.get(p.user_id)
      if (!email) continue

      const trialActive = p.trial_ends_at && new Date(p.trial_ends_at) > new Date(nowIso)
      if (trialActive) {
        recipients.push({ userId: p.user_id, email })
        continue
      }

      // Check stripe subscription status
      try {
        const { data: sub } = await supabase.functions.invoke('check-subscription', {
          body: { userId: p.user_id },
        })
        if (sub?.subscribed) {
          recipients.push({ userId: p.user_id, email })
        }
      } catch (_) {
        // Skip on error
      }
    }

    // 5. Enqueue one transactional email per recipient
    const weekLabel = fmtDate(row.effective_date)
    const previousLabel = fmtDate(row.previous_date)
    const templateData = {
      weekLabel,
      previousLabel,
      totalChanged: row.total_changed,
      topIncreases: row.top_increases,
      topDecreases: row.top_decreases,
    }

    let sent = 0
    let failed = 0
    for (const r of recipients) {
      try {
        await supabase.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'weekly-movers-digest',
            recipientEmail: r.email,
            idempotencyKey: `movers-digest-${row.effective_date}-${r.userId}`,
            templateData,
          },
        })
        sent++
      } catch (e) {
        console.error('send failed', r.email, e)
        failed++
      }
    }

    return new Response(
      JSON.stringify({ success: true, effectiveDate: row.effective_date, sent, failed, candidates: recipients.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('send-movers-digest error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
