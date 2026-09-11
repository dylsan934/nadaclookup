REVOKE ALL ON FUNCTION public.compute_weekly_movers() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.compute_weekly_movers() TO service_role;