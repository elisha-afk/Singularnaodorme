-- Hardening: least-privilege grants, unit-aware RLS and no public write paths.
-- The site and the admin panel only reach the database through Edge Functions (service role),
-- so none of this affects normal use. It closes the direct PostgREST API for staff and anon.

-- 1) Report access = year AND unit. Staff with a unit only see that unit; staff without one see every unit.
CREATE OR REPLACE FUNCTION public.can_access_report(report_year SMALLINT, report_school TEXT, user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.admin_profiles
        WHERE id = user_id
          AND active = TRUE
          AND (
              role = 'admin'
              OR (
                  report_year IS NOT NULL
                  AND report_year = ANY(allowed_years)
                  AND (
                      nullif(trim(school), '') IS NULL
                      OR lower(trim(school)) = lower(trim(coalesce(report_school, '')))
                  )
              )
          )
    );
$$;

REVOKE ALL ON FUNCTION public.can_access_report(SMALLINT, TEXT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_report(SMALLINT, TEXT, UUID) TO authenticated, service_role;

DROP POLICY IF EXISTS "Staff read reports by year" ON public.relatos;
DROP POLICY IF EXISTS "Staff update reports by year" ON public.relatos;
CREATE POLICY "Staff read reports by year and unit" ON public.relatos
    FOR SELECT TO authenticated USING (public.can_access_report(ano, escola));
CREATE POLICY "Staff update reports by year and unit" ON public.relatos
    FOR UPDATE TO authenticated
    USING (public.can_access_report(ano, escola))
    WITH CHECK (public.can_access_report(ano, escola));

-- Notes: staff read notes of reports they can access and add their own; they cannot edit or delete notes.
DROP POLICY IF EXISTS "Staff manage notes by year" ON public.relato_notes;
CREATE POLICY "Staff read notes by year and unit" ON public.relato_notes
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.relatos WHERE relatos.id = relato_notes.relato_id AND public.can_access_report(relatos.ano, relatos.escola)));
CREATE POLICY "Staff add own notes" ON public.relato_notes
    FOR INSERT TO authenticated
    WITH CHECK (author_id = auth.uid() AND EXISTS (SELECT 1 FROM public.relatos WHERE relatos.id = relato_notes.relato_id AND public.can_access_report(relatos.ano, relatos.escola)));

DROP POLICY IF EXISTS "Staff read responses by year" ON public.relato_responses;
CREATE POLICY "Staff read responses by year and unit" ON public.relato_responses
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.relatos WHERE relatos.id = relato_responses.relato_id AND public.can_access_report(relatos.ano, relatos.escola)));

DROP FUNCTION IF EXISTS public.can_access_report_year(SMALLINT, UUID);

-- 2) No public write paths: legacy `reports` form and unused `contatos` form.
DROP POLICY IF EXISTS "Anyone can submit a report" ON public.reports;
DROP POLICY IF EXISTS "Allow inserts on contatos" ON public.contatos;

-- 3) Least privilege. anon gets nothing on tables; authenticated only what the policies above need.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

GRANT SELECT ON public.admin_profiles, public.school_units, public.relato_responses, public.audit_logs TO authenticated;
GRANT SELECT ON public.relato_notes TO authenticated;
GRANT INSERT ON public.relato_notes TO authenticated;

-- relatos: staff read every column except the origin hash, and may only change triage fields.
DO $$
DECLARE
    readable TEXT;
BEGIN
    SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position) INTO readable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'relatos' AND column_name <> 'origem_hash';
    EXECUTE format('GRANT SELECT (%s) ON public.relatos TO authenticated', readable);
END $$;

GRANT UPDATE (status, priority, assigned_to, data_atualizacao, suspeito, suspeito_tipo, motivo_suspeita)
    ON public.relatos TO authenticated;

-- 4) Helper functions: the role checks take an arbitrary user id, so they are not for anonymous callers.
REVOKE EXECUTE ON FUNCTION public.is_admin(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_active_staff(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_relato_stats() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_relato_stats() TO service_role;
