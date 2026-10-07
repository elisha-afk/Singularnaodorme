-- Existing values were stored as UTC without a zone marker; browsers read them as local time (3h off in Brasilia).
ALTER TABLE public.relatos
    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
    ALTER COLUMN data_atualizacao TYPE TIMESTAMPTZ USING data_atualizacao AT TIME ZONE 'UTC',
    ALTER COLUMN data_criacao TYPE TIMESTAMPTZ USING data_criacao AT TIME ZONE 'UTC';

ALTER TABLE public.contatos
    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
    ALTER COLUMN data_envio TYPE TIMESTAMPTZ USING data_envio AT TIME ZONE 'UTC';
