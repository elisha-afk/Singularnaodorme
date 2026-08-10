ALTER TABLE public.relatos
    ADD COLUMN IF NOT EXISTS destino TEXT NOT NULL DEFAULT 'coordenacao';

ALTER TABLE public.relatos
    DROP CONSTRAINT IF EXISTS relatos_destino_check;

ALTER TABLE public.relatos
    ADD CONSTRAINT relatos_destino_check
    CHECK (destino IN ('coordenacao', 'orientacao'));

CREATE INDEX IF NOT EXISTS relatos_destino_data_idx
    ON public.relatos(destino, data_criacao DESC);

CREATE OR REPLACE FUNCTION public.can_access_report_destination(report_destination TEXT, user_id UUID DEFAULT auth.uid())
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
              OR (role = 'coordinator' AND report_destination = 'coordenacao')
              OR (role = 'orientacao' AND report_destination = 'orientacao')
          )
    );
$$;

REVOKE ALL ON FUNCTION public.can_access_report_destination(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_access_report_destination(TEXT, UUID) TO authenticated, service_role;

DROP POLICY IF EXISTS "Active staff can read reports" ON public.relatos;
DROP POLICY IF EXISTS "Active staff can update reports" ON public.relatos;
DROP POLICY IF EXISTS "Staff read reports" ON public.relatos;
DROP POLICY IF EXISTS "Staff update reports" ON public.relatos;

CREATE POLICY "Staff read reports by destination" ON public.relatos
    FOR SELECT TO authenticated
    USING (public.can_access_report_destination(destino));

CREATE POLICY "Staff update reports by destination" ON public.relatos
    FOR UPDATE TO authenticated
    USING (public.can_access_report_destination(destino))
    WITH CHECK (public.can_access_report_destination(destino));

DROP POLICY IF EXISTS "Staff manage notes" ON public.relato_notes;
CREATE POLICY "Staff manage notes by destination" ON public.relato_notes
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.relatos
            WHERE relatos.id = relato_notes.relato_id
              AND public.can_access_report_destination(relatos.destino)
        )
    )
    WITH CHECK (
        author_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.relatos
            WHERE relatos.id = relato_notes.relato_id
              AND public.can_access_report_destination(relatos.destino)
        )
    );

DROP POLICY IF EXISTS "Staff read responses" ON public.relato_responses;
CREATE POLICY "Staff read responses by destination" ON public.relato_responses
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.relatos
            WHERE relatos.id = relato_responses.relato_id
              AND public.can_access_report_destination(relatos.destino)
        )
    );

COMMENT ON COLUMN public.relatos.destino IS 'Team selected by the reporter: coordination or school guidance.';