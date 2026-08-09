ALTER TABLE public.admin_profiles
    ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN public.admin_profiles.must_change_password IS 'Forces newly created staff to replace the temporary password at first login.';