-- Migration pour le support multi-département, filière et classe

-- 1. Création des tables de hiérarchie
CREATE TABLE public.departements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  libelle TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.departements ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.filieres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  libelle TEXT NOT NULL,
  departement_id UUID NOT NULL REFERENCES public.departements(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.filieres ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  libelle TEXT NOT NULL,
  filiere_id UUID NOT NULL REFERENCES public.filieres(id) ON DELETE CASCADE,
  niveau TEXT NOT NULL CHECK (niveau IN ('L1', 'L2', 'L3')),
  annee_universitaire TEXT NOT NULL DEFAULT '2025-2026',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- 2. Modification des tables existantes
ALTER TABLE public.matieres ADD COLUMN classe_id UUID REFERENCES public.classes(id) ON DELETE CASCADE;
ALTER TABLE public.etudiants ADD COLUMN classe_id UUID REFERENCES public.classes(id) ON DELETE SET NULL;

-- 3. RLS Policies
CREATE POLICY "auth read departements" ON public.departements FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin write departements" ON public.departements FOR ALL USING (public.is_admin_or_staff(auth.uid())) WITH CHECK (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "auth read filieres" ON public.filieres FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin write filieres" ON public.filieres FOR ALL USING (public.is_admin_or_staff(auth.uid())) WITH CHECK (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "auth read classes" ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin write classes" ON public.classes FOR ALL USING (public.is_admin_or_staff(auth.uid())) WITH CHECK (public.is_admin_or_staff(auth.uid()));

-- 4. Peuplement des données de base
INSERT INTO public.departements (code, libelle) VALUES
  ('MTIC', 'Management des TIC'),
  ('RSN', 'Réseaux et Systèmes Numériques'),
  ('AV', 'Audio-Visuel');

WITH d_mtic AS (SELECT id FROM public.departements WHERE code = 'MTIC'),
     d_rsn AS (SELECT id FROM public.departements WHERE code = 'RSN'),
     d_av AS (SELECT id FROM public.departements WHERE code = 'AV')
INSERT INTO public.filieres (code, libelle, departement_id) VALUES
  ('TC', 'Technique Commercial', (SELECT id FROM d_mtic)),
  ('MD', 'Marketing Digital', (SELECT id FROM d_mtic)),
  ('GI', 'Génie Informatique', (SELECT id FROM d_rsn)),
  ('RT', 'Réseaux et Télécommunication', (SELECT id FROM d_rsn)),
  ('JO', 'Journalisme', (SELECT id FROM d_av)),
  ('VD', 'Vidéo', (SELECT id FROM d_av)),
  ('AU', 'Audio', (SELECT id FROM d_av));

-- Peuplement des classes (3 niveaux pour chaque filière)
DO $$
DECLARE
  f_record RECORD;
  niv TEXT;
BEGIN
  FOR f_record IN SELECT id, code, libelle FROM public.filieres LOOP
    FOREACH niv IN ARRAY ARRAY['L1', 'L2', 'L3'] LOOP
      INSERT INTO public.classes (code, libelle, filiere_id, niveau)
      VALUES (
        f_record.code || '-' || niv,
        f_record.libelle || ' - Licence ' || substr(niv, 2, 1),
        f_record.id,
        niv
      );
    END LOOP;
  END LOOP;
END $$;

-- 5. Migration des données existantes (Matières ASUR -> GI-L3)
UPDATE public.matieres 
SET classe_id = (SELECT id FROM public.classes WHERE code = 'GI-L3');

-- Migration des étudiants existants -> GI-L3
UPDATE public.etudiants 
SET classe_id = (SELECT id FROM public.classes WHERE code = 'GI-L3');
