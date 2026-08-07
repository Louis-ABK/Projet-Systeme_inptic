import { ClasseKey, getSubjects } from "./referentiel";

export type Student = {
  matricule: string;
  nom: string;
  prenom: string;
  dateNaissance?: string | null;
  lieuNaissance?: string | null;
  sexe?: string | null;
  etablissement?: string | null;
  
  // Nouveaux champs pour le multi-filière
  classeKey?: ClasseKey;
  departement?: string;
  filiere?: string;
  niveau?: string;

  // Notes dynamiques selon la classe (la clé 'moyenne' y sera incluse)
  s5: Record<string, number>;
  s6: Record<string, number>;
  moyenneGenerale: number;
};

/** Liste vide par défaut — les données réelles viennent de Supabase */
export const STUDENTS: Student[] = [];

export const getMention = (moy: number): string => {
  if (moy >= 16) return 'Très Bien';
  if (moy >= 14) return 'Bien';
  if (moy >= 12) return 'Assez Bien';
  if (moy >= 10) return 'Passable';
  return 'Insuffisant';
};

export const getDecision = (
  moyGen: number,
  s5: number,
  s6: number,
  student?: Student
): { label: string; type: 'admis' | 'compensation' | 'reprise' | 'refuse' } => {
  if (student) {
    const credS5 = getCredits(student, 's5');
    const credS6 = getCredits(student, 's6');
    
    // Règle spécifique pour L3
    if (student.classeKey?.includes('-L3')) {
      const s6Subjects = getSubjects(student.classeKey, 's6');
      const ueStage = s6Subjects.filter((x) => x.ue === 'UE6-2' || x.ue === 'UE6-3');
      const totalCoefUEStage = ueStage.reduce((a, b) => a + b.coef, 0);
      let moyUEStage = 0;
      if (totalCoefUEStage > 0) {
        moyUEStage = ueStage.reduce((a, b) => a + (student.s6[b.key] || 0) * b.coef, 0) / totalCoefUEStage;
      }
      const ueStageAcquise = moyUEStage >= 10 || s6 >= 10;

      if (moyGen >= 10 && s5 >= 10 && s6 >= 10)
        return { label: 'Diplômé(e)', type: 'admis' };
      if (!ueStageAcquise && credS5 >= 30 && credS6 >= 22)
        return { label: 'Reprise de soutenance', type: 'reprise' };
      return { label: 'Redouble la Licence 3', type: 'refuse' };
    } else {
      // Règles générales pour L1 et L2
      if (moyGen >= 10 && s5 >= 10 && s6 >= 10)
        return { label: 'Admis(e) en classe supérieure', type: 'admis' };
      if (moyGen >= 10 && (s5 < 10 || s6 < 10))
        return { label: 'Admis(e) par compensation', type: 'compensation' };
      return { label: 'Redouble', type: 'refuse' };
    }
  }
  
  // Fallback sans objet student
  if (moyGen >= 10 && s5 >= 10 && s6 >= 10) return { label: 'Diplômé(e) / Admis(e)', type: 'admis' };
  if (moyGen >= 10) return { label: 'Admis(e) par compensation', type: 'compensation' };
  return { label: 'Refusé / Redouble', type: 'refuse' };
};

export const getCredits = (s: Student, sem: 's5' | 's6'): number => {
  const subjects = getSubjects(s.classeKey, sem);
  const ues = Array.from(new Set(subjects.map(sub => sub.ue)));
  let credits = 0;
  const grades = sem === 's5' ? s.s5 : s.s6;
  const moyemSem = grades.moyenne || 0;

  for (const ue of ues) {
    const ueSubjects = subjects.filter(x => x.ue === ue);
    const totalCoef = ueSubjects.reduce((a, b) => a + b.coef, 0);
    const sum = ueSubjects.reduce((a, b) => a + (grades[b.key] || 0) * b.coef, 0);
    const moyUE = totalCoef ? sum / totalCoef : 0;

    // UE acquise si moyenne UE >= 10, ou par compensation si moyenne semestre >= 10
    if (moyUE >= 10 || moyemSem >= 10) {
      credits += ueSubjects.reduce((a, b) => a + b.credits, 0);
    }
  }
  return credits;
};

// Rétrocompatibilité
export const getCreditsS5 = (s: Student) => getCredits(s, 's5');
export const getCreditsS6 = (s: Student) => getCredits(s, 's6');
