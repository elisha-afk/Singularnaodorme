-- Kind of suspicion (hate message or threat) and the hashed origin, kept only while the report is analysed.
ALTER TABLE public.relatos
    ADD COLUMN IF NOT EXISTS suspeito_tipo TEXT CHECK (suspeito_tipo IN ('odio', 'ameaca')),
    ADD COLUMN IF NOT EXISTS origem_hash TEXT,
    ADD COLUMN IF NOT EXISTS origem_registrada_em TIMESTAMPTZ;

-- Reports already flagged before this migration were hate messages.
UPDATE public.relatos SET suspeito_tipo = 'odio' WHERE suspeito = TRUE AND suspeito_tipo IS NULL;

CREATE INDEX IF NOT EXISTS relatos_suspeito_tipo_idx ON public.relatos(suspeito, suspeito_tipo, data_criacao DESC);

-- Blocked origins. Only salted hashes are stored, never IP addresses. Administrators only (via edge functions).
CREATE TABLE IF NOT EXISTS public.blocked_origins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin_hash TEXT NOT NULL,
    block_number SMALLINT NOT NULL DEFAULT 1,
    blocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- NULL = definitive (second block)
    blocked_by UUID REFERENCES public.admin_profiles(id) ON DELETE SET NULL,
    blocked_by_name TEXT,
    report_id UUID REFERENCES public.relatos(id) ON DELETE SET NULL,
    report_code TEXT,
    cancelled BOOLEAN NOT NULL DEFAULT FALSE,
    cancelled_at TIMESTAMPTZ,
    cancelled_by_name TEXT
);

CREATE INDEX IF NOT EXISTS blocked_origins_hash_idx ON public.blocked_origins(origin_hash, blocked_at DESC);

ALTER TABLE public.blocked_origins ENABLE ROW LEVEL SECURITY;
-- No policies on purpose: only the service role (edge functions) can read or write it.

-- Retention: origin hashes on reports last 24h; expired block records last 12 months (definitive blocks stay until lifted).
CREATE OR REPLACE FUNCTION public.purge_origin_data()
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
    UPDATE public.relatos
        SET origem_hash = NULL, origem_registrada_em = NULL
        WHERE origem_hash IS NOT NULL AND origem_registrada_em < NOW() - INTERVAL '24 hours';
    DELETE FROM public.blocked_origins
        WHERE expires_at IS NOT NULL AND expires_at < NOW() - INTERVAL '12 months';
    DELETE FROM public.blocked_origins
        WHERE cancelled = TRUE AND cancelled_at < NOW() - INTERVAL '12 months';
    DELETE FROM public.submission_attempts WHERE created_at < NOW() - INTERVAL '24 hours';
$$;

REVOKE ALL ON FUNCTION public.purge_origin_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_origin_data() TO service_role;
