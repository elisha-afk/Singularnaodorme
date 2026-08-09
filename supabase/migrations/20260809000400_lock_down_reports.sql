DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'relatos'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.relatos', policy_record.policyname);
    END LOOP;
END $$;

ALTER TABLE public.relatos ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.relatos FROM anon;
REVOKE ALL ON TABLE public.relatos FROM authenticated;
GRANT SELECT, UPDATE ON TABLE public.relatos TO authenticated;

CREATE POLICY "Active staff can read reports" ON public.relatos
    FOR SELECT TO authenticated
    USING (public.is_active_staff());

CREATE POLICY "Active staff can update reports" ON public.relatos
    FOR UPDATE TO authenticated
    USING (public.is_active_staff())
    WITH CHECK (public.is_active_staff());

COMMENT ON TABLE public.relatos IS 'Sensitive reports. Public access is exclusively mediated by Edge Functions.';