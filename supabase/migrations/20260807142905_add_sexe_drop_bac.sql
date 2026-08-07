ALTER TABLE public.etudiants
  ADD COLUMN sexe TEXT,
  DROP COLUMN IF EXISTS bac;
