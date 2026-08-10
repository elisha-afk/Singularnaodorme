ALTER TABLE public.admin_profiles
    DROP CONSTRAINT IF EXISTS admin_profiles_role_check;

ALTER TABLE public.admin_profiles
    ADD CONSTRAINT admin_profiles_role_check
    CHECK (role IN ('admin', 'coordinator', 'orientacao'));

COMMENT ON COLUMN public.admin_profiles.role IS 'Access profile: administrator, coordination, or school guidance.';