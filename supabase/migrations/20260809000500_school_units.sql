CREATE TABLE IF NOT EXISTS public.school_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES public.admin_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT school_units_name_len CHECK (char_length(trim(name)) BETWEEN 2 AND 120),
    CONSTRAINT school_units_category_len CHECK (char_length(trim(category)) BETWEEN 2 AND 80)
);

CREATE UNIQUE INDEX IF NOT EXISTS school_units_name_unique_idx ON public.school_units ((lower(trim(name))));
CREATE INDEX IF NOT EXISTS school_units_active_category_idx ON public.school_units (active, category, name);

ALTER TABLE public.school_units ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff read school units" ON public.school_units;
CREATE POLICY "Staff read school units" ON public.school_units
    FOR SELECT TO authenticated
    USING (public.is_active_staff());

DROP POLICY IF EXISTS "Admins manage school units" ON public.school_units;
CREATE POLICY "Admins manage school units" ON public.school_units
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

GRANT SELECT ON public.school_units TO authenticated;
GRANT INSERT, UPDATE ON public.school_units TO authenticated;

COMMENT ON TABLE public.school_units IS 'School units used in report routing and triage.';
