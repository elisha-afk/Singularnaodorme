-- Only the service role (edge functions) may run the purge; the year-access helper is not needed by anon.
REVOKE EXECUTE ON FUNCTION public.purge_origin_data() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.can_access_report_year(SMALLINT, UUID) FROM anon;
