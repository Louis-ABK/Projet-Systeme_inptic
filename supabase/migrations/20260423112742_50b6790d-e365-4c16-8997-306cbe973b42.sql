
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'secretariat', 'enseignant', 'etudiant');
CREATE TYPE public.eval_type AS ENUM ('cc', 'examen', 'rattrapage');

-- ============ HELPER FUNCTIONS ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT,
  prenom TEXT,
  matricule TEXT UNIQUE,
  date_naissance DATE,
  lieu_naissance TEXT,
  bac TEXT,
  etablissement TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ USER_ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','secretariat'));
$$;

-- ============ SEMESTRES / UES / MATIERES ============
CREATE TABLE public.semestres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  libelle TEXT NOT NULL,
  annee_universitaire TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.semestres ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.ues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  libelle TEXT NOT NULL,
  semestre_id UUID NOT NULL REFERENCES public.semestres(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ues ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.matieres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  libelle TEXT NOT NULL,
  coefficient NUMERIC(4,2) NOT NULL DEFAULT 1,
  credits INT NOT NULL DEFAULT 1,
  ue_id UUID NOT NULL REFERENCES public.ues(id) ON DELETE CASCADE,
  ordre INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.matieres ENABLE ROW LEVEL SECURITY;

-- ============ ETUDIANTS ============
CREATE TABLE public.etudiants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricule TEXT NOT NULL UNIQUE,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  date_naissance DATE,
  lieu_naissance TEXT,
  bac TEXT,
  etablissement TEXT,
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.etudiants ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_etudiants_updated BEFORE UPDATE ON public.etudiants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ EVALUATIONS ============
CREATE TABLE public.evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etudiant_id UUID NOT NULL REFERENCES public.etudiants(id) ON DELETE CASCADE,
  matiere_id UUID NOT NULL REFERENCES public.matieres(id) ON DELETE CASCADE,
  type public.eval_type NOT NULL,
  note NUMERIC(4,2) NOT NULL CHECK (note >= 0 AND note <= 20),
  date_saisie TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(etudiant_id, matiere_id, type)
);
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_evaluations_updated BEFORE UPDATE ON public.evaluations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ ABSENCES ============
CREATE TABLE public.absences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etudiant_id UUID NOT NULL REFERENCES public.etudiants(id) ON DELETE CASCADE,
  matiere_id UUID NOT NULL REFERENCES public.matieres(id) ON DELETE CASCADE,
  heures NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(etudiant_id, matiere_id)
);
ALTER TABLE public.absences ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_absences_updated BEFORE UPDATE ON public.absences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ RLS POLICIES ============
CREATE POLICY "users read own profile" ON public.profiles FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin_or_staff(auth.uid()));
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin_or_staff(auth.uid()));
CREATE POLICY "staff insert profiles" ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.is_admin_or_staff(auth.uid()));

CREATE POLICY "user reads own roles" ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin manages roles" ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "auth read semestres" ON public.semestres FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff write semestres" ON public.semestres FOR ALL
  USING (public.is_admin_or_staff(auth.uid())) WITH CHECK (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "auth read ues" ON public.ues FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff write ues" ON public.ues FOR ALL
  USING (public.is_admin_or_staff(auth.uid())) WITH CHECK (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "auth read matieres" ON public.matieres FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff write matieres" ON public.matieres FOR ALL
  USING (public.is_admin_or_staff(auth.uid())) WITH CHECK (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "etudiant read own" ON public.etudiants FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin_or_staff(auth.uid()));
CREATE POLICY "staff write etudiants" ON public.etudiants FOR ALL
  USING (public.is_admin_or_staff(auth.uid())) WITH CHECK (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "etudiant read own evaluations" ON public.evaluations FOR SELECT
  USING (
    public.is_admin_or_staff(auth.uid())
    OR public.has_role(auth.uid(), 'enseignant')
    OR EXISTS (SELECT 1 FROM public.etudiants e WHERE e.id = evaluations.etudiant_id AND e.user_id = auth.uid())
  );
CREATE POLICY "staff write evaluations" ON public.evaluations FOR ALL
  USING (public.is_admin_or_staff(auth.uid()) OR public.has_role(auth.uid(), 'enseignant'))
  WITH CHECK (public.is_admin_or_staff(auth.uid()) OR public.has_role(auth.uid(), 'enseignant'));

CREATE POLICY "etudiant read own absences" ON public.absences FOR SELECT
  USING (
    public.is_admin_or_staff(auth.uid())
    OR EXISTS (SELECT 1 FROM public.etudiants e WHERE e.id = absences.etudiant_id AND e.user_id = auth.uid())
  );
CREATE POLICY "staff write absences" ON public.absences FOR ALL
  USING (public.is_admin_or_staff(auth.uid())) WITH CHECK (public.is_admin_or_staff(auth.uid()));

-- ============ TRIGGER NEW USER ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nom, prenom, matricule)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'nom',
    NEW.raw_user_meta_data->>'prenom',
    NEW.raw_user_meta_data->>'matricule'
  )
  ON CONFLICT (user_id) DO NOTHING;

  IF (NEW.raw_user_meta_data->>'role') IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, (NEW.raw_user_meta_data->>'role')::public.app_role)
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'etudiant')
    ON CONFLICT DO NOTHING;
  END IF;

  IF (NEW.raw_user_meta_data->>'matricule') IS NOT NULL THEN
    UPDATE public.etudiants SET user_id = NEW.id
    WHERE matricule = NEW.raw_user_meta_data->>'matricule' AND user_id IS NULL;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ SEED RÉFÉRENTIEL ============
INSERT INTO public.semestres (code, libelle, annee_universitaire) VALUES
  ('S5', 'Semestre 5', '2025-2026'),
  ('S6', 'Semestre 6', '2025-2026');

INSERT INTO public.ues (code, libelle, semestre_id) VALUES
  ('UE5-1', 'Enseignement Général', (SELECT id FROM public.semestres WHERE code='S5')),
  ('UE5-2', 'Connaissances de Base et Outils pour les Réseaux d''Entreprise', (SELECT id FROM public.semestres WHERE code='S5')),
  ('UE6-1', 'Sciences de Base', (SELECT id FROM public.semestres WHERE code='S6')),
  ('UE6-2', 'Télécommunications et Réseaux', (SELECT id FROM public.semestres WHERE code='S6'));

-- Matières (code, libelle, coef, credits, ue_code, ordre)
WITH ue_map AS (SELECT code, id FROM public.ues)
INSERT INTO public.matieres (code, libelle, coefficient, credits, ue_id, ordre)
SELECT m.code, m.libelle, m.coef::numeric, m.credits, u.id, m.ordre
FROM (VALUES
  ('anglais',         'Anglais technique',                              1, 2, 'UE5-1', 1),
  ('management',      'Management d''équipe',                            1, 1, 'UE5-1', 2),
  ('communication',   'Communication',                                   2, 1, 'UE5-1', 3),
  ('droit',           'Droit de l''informatique',                        2, 2, 'UE5-1', 4),
  ('gestionProjets',  'Gestion de projets',                              1, 1, 'UE5-1', 5),
  ('veille',          'Veille technologique',                            1, 1, 'UE5-1', 6),
  ('programmation',   'Consolidation des bases de la programmation',     2, 2, 'UE5-1', 7),
  ('bdd',             'Conception BDD et langage SQL',                   2, 2, 'UE5-1', 8),
  ('ios',             'Remise à niveau IOS',                             2, 2, 'UE5-2', 9),
  ('lan',             'Connaissance des réseaux LAN',                    2, 2, 'UE5-2', 10),
  ('scripts',         'Les langages du script',                          2, 2, 'UE5-2', 11),
  ('virtualisation',  'Virtualisation',                                  3, 3, 'UE5-2', 12),
  ('clientServeur',   'Application client-serveur',                      2, 2, 'UE5-2', 13),
  ('telephonie',      'Téléphonie IP avancée',                           2, 2, 'UE5-2', 14),
  ('svaa',            'Services à valeur ajoutée',                       2, 2, 'UE5-2', 15),
  ('ccna2',           'CCNA2',                                           1, 2, 'UE5-2', 16),
  ('windows',         'Environnement Windows',                           3, 3, 'UE6-1', 17),
  ('linux',           'Environnement Linux',                             3, 3, 'UE6-1', 18),
  ('interop',         'Interopérabilité',                                3, 3, 'UE6-1', 19),
  ('cryptage',        'Cryptage et Authentification',                    2, 2, 'UE6-1', 20),
  ('prevention',      'Prévention et Sécurité',                          3, 3, 'UE6-1', 21),
  ('optimisation',    'Optimisation de l''accès Internet',               3, 3, 'UE6-1', 22),
  ('accesDistant',    'Contrôle d''accès distant',                       2, 2, 'UE6-1', 23),
  ('ccna3',           'CCNA3',                                           1, 1, 'UE6-1', 24),
  ('methodologie',    'Méthodologie de rédaction du rapport de stage',   2, 2, 'UE6-2', 25),
  ('soutenance',      'Soutenance',                                      8, 8, 'UE6-2', 26)
) AS m(code, libelle, coef, credits, ue_code, ordre)
JOIN ue_map u ON u.code = m.ue_code;
