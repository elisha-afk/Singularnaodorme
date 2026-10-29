-- Each unit teaches one stage: Ensino Médio (1ª a 3ª série) or Ensino Fundamental (1º a 9º ano).
-- The year column keeps a number (1-9); the unit's level decides how it is named and which values are valid.
ALTER TABLE public.school_units
    ADD COLUMN IF NOT EXISTS level TEXT NOT NULL DEFAULT 'medio';

ALTER TABLE public.school_units DROP CONSTRAINT IF EXISTS school_units_level_check;
ALTER TABLE public.school_units
    ADD CONSTRAINT school_units_level_check CHECK (level IN ('medio', 'fundamental'));

UPDATE public.school_units
    SET level = CASE WHEN lower(category) LIKE '%fundamental%' THEN 'fundamental' ELSE 'medio' END;
UPDATE public.school_units
    SET category = CASE level WHEN 'fundamental' THEN 'Ensino Fundamental' ELSE 'Ensino Médio' END;

ALTER TABLE public.relatos DROP CONSTRAINT IF EXISTS relatos_ano_check;
ALTER TABLE public.relatos ADD CONSTRAINT relatos_ano_check CHECK (ano BETWEEN 1 AND 9);

ALTER TABLE public.admin_profiles DROP CONSTRAINT IF EXISTS admin_profiles_allowed_years_check;
ALTER TABLE public.admin_profiles
    ADD CONSTRAINT admin_profiles_allowed_years_check
    CHECK (allowed_years <@ ARRAY[1,2,3,4,5,6,7,8,9]::SMALLINT[]);

COMMENT ON COLUMN public.school_units.level IS 'medio = 1ª a 3ª série; fundamental = 1º ao 9º ano.';
COMMENT ON COLUMN public.relatos.ano IS 'Year number (1-9) chosen by the reporter; its name (série or ano) depends on the level of the unit.';
