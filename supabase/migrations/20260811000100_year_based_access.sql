-- Access is now granted per school year (1, 2, 3) instead of coordination/guidance roles.
ALTER TABLE public.admin_profiles
    ADD COLUMN IF NOT EXISTS allowed_years SMALLINT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.admin_profiles
    DROP CONSTRAINT IF EXISTS admin_profiles_role_check;

-- Existing coordinators/guidance staff keep full access to every year.
UPDATE public.admin_profiles
    SET role = 'staff', allowed_years = '{1,2,3}'
    WHERE role IN ('coordinator', 'orientacao');

ALTER TABLE public.admin_profiles
    ALTER COLUMN role SET DEFAULT 'staff',
    ADD CONSTRAINT admin_profiles_role_check CHECK (role IN ('admin', 'staff')),
    ADD CONSTRAINT admin_profiles_allowed_years_check CHECK (allowed_years <@ ARRAY[1,2,3]::SMALLINT[]);

COMMENT ON COLUMN public.admin_profiles.role IS 'Access profile: administrator or staff (staff sees only the years in allowed_years).';

ALTER TABLE public.relatos
    ADD COLUMN IF NOT EXISTS ano SMALLINT CHECK (ano IN (1, 2, 3));

COMMENT ON COLUMN public.relatos.ano IS 'School year (1-3) of the student, chosen by the reporter. NULL = unclassified (admin only).';

CREATE INDEX IF NOT EXISTS relatos_ano_data_idx ON public.relatos(ano, data_criacao DESC);

CREATE OR REPLACE FUNCTION public.can_access_report_year(report_year SMALLINT, user_id UUID DEFAULT auth.uid())
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
          AND (role = 'admin' OR (report_year IS NOT NULL AND report_year = ANY(allowed_years)))
    );
$$;

REVOKE ALL ON FUNCTION public.can_access_report_year(SMALLINT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_access_report_year(SMALLINT, UUID) TO authenticated, service_role;

DROP POLICY IF EXISTS "Staff read reports by destination" ON public.relatos;
DROP POLICY IF EXISTS "Staff update reports by destination" ON public.relatos;
CREATE POLICY "Staff read reports by year" ON public.relatos
    FOR SELECT TO authenticated USING (public.can_access_report_year(ano));
CREATE POLICY "Staff update reports by year" ON public.relatos
    FOR UPDATE TO authenticated
    USING (public.can_access_report_year(ano))
    WITH CHECK (public.can_access_report_year(ano));

DROP POLICY IF EXISTS "Staff manage notes by destination" ON public.relato_notes;
CREATE POLICY "Staff manage notes by year" ON public.relato_notes
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.relatos WHERE relatos.id = relato_notes.relato_id AND public.can_access_report_year(relatos.ano)))
    WITH CHECK (author_id = auth.uid() AND EXISTS (SELECT 1 FROM public.relatos WHERE relatos.id = relato_notes.relato_id AND public.can_access_report_year(relatos.ano)));

DROP POLICY IF EXISTS "Staff read responses by destination" ON public.relato_responses;
CREATE POLICY "Staff read responses by year" ON public.relato_responses
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.relatos WHERE relatos.id = relato_responses.relato_id AND public.can_access_report_year(relatos.ano)));

DROP FUNCTION IF EXISTS public.can_access_report_destination(TEXT, UUID);
