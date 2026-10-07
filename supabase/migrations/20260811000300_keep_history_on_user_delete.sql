-- Allow removing a staff account while keeping the notes/responses they wrote.
ALTER TABLE public.relato_notes ALTER COLUMN author_id DROP NOT NULL;
ALTER TABLE public.relato_notes DROP CONSTRAINT IF EXISTS relato_notes_author_id_fkey;
ALTER TABLE public.relato_notes ADD CONSTRAINT relato_notes_author_id_fkey
    FOREIGN KEY (author_id) REFERENCES public.admin_profiles(id) ON DELETE SET NULL;

ALTER TABLE public.relato_responses ALTER COLUMN author_id DROP NOT NULL;
ALTER TABLE public.relato_responses DROP CONSTRAINT IF EXISTS relato_responses_author_id_fkey;
ALTER TABLE public.relato_responses ADD CONSTRAINT relato_responses_author_id_fkey
    FOREIGN KEY (author_id) REFERENCES public.admin_profiles(id) ON DELETE SET NULL;
