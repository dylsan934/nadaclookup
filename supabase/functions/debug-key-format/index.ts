Deno.serve(() => {
  const sk = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const ak = Deno.env.get('SUPABASE_ANON_KEY') || ''
  return new Response(JSON.stringify({
    service_prefix: sk.slice(0, 10),
    service_dots: (sk.match(/\./g) || []).length,
    service_len: sk.length,
    anon_prefix: ak.slice(0, 10),
    anon_dots: (ak.match(/\./g) || []).length,
  }), { headers: { 'content-type': 'application/json' } })
})
