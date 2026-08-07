-- Table des absences injustifiees par matiere et par etudiant
CREATE TABLE IF NOT EXISTS public.absences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etudiant_id UUID NOT NULL REFERENCES public.etudiants(id) ON DELETE CASCADE,
  matiere_id UUID NOT NULL REFERENCES public.matieres(id) ON DELETE CASCADE,
  heures NUMERIC(5,1) NOT NULL DEFAULT 0 CHECK (heures >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(etudiant_id, matiere_id)
);

ALTER TABLE public.absences ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_absences_updated BEFORE UPDATE ON public.absences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "admin_all_absences" ON public.absences
  FOR ALL
  USING (public.is_admin_or_staff(auth.uid()))
  WITH CHECK (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "enseignant_all_absences" ON public.absences
  FOR ALL
  USING (public.has_role(auth.uid(), 'enseignant'))
  WITH CHECK (public.has_role(auth.uid(), 'enseignant'));

CREATE POLICY "etudiant_read_own_absences" ON public.absences
  FOR SELECT
  USING (
    etudiant_id IN (
      SELECT id FROM public.etudiants
      WHERE auth_user_id = auth.uid()
    )
  );
