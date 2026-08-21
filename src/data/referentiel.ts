export type Niveau = 'L1' | 'L2' | 'L3';
export type ClasseKey = string; // e.g. 'GI-L3', 'TC-L1'

export type SubjectDef = {
  key: string;
  label: string;
  credits: number;
  coef: number;
  ue: string;
};

export type Departement = {
  code: string;
  libelle: string;
  filieres: string[];
};

export let DEPARTEMENTS: Departement[] = [];

export let FILIERES_MAP: Record<string, { libelle: string; dept: string }> = {};

export let MATIERES_BY_CLASSE: Record<ClasseKey, { s5: SubjectDef[]; s6: SubjectDef[] }> = {};

export const initReferentiel = (depts: Departement[], filieresMap: Record<string, { libelle: string; dept: string }>, matieresByClasse: Record<ClasseKey, { s5: SubjectDef[]; s6: SubjectDef[] }>) => {
  DEPARTEMENTS = depts;
  FILIERES_MAP = filieresMap;
  MATIERES_BY_CLASSE = matieresByClasse;
};

// ==========================================
// UTILITAIRES DE SEMESTRES
// ==========================================

export const getSemesterLabels = (niveau?: string | null): [string, string] => {
  if (niveau === 'L1') return ['Semestre 1', 'Semestre 2'];
  if (niveau === 'L2') return ['Semestre 3', 'Semestre 4'];
  return ['Semestre 5', 'Semestre 6'];
};

export const getSemesterShortLabels = (niveau?: string | null): [string, string] => {
  if (niveau === 'L1') return ['S1', 'S2'];
  if (niveau === 'L2') return ['S3', 'S4'];
  return ['S5', 'S6'];
};

// ==========================================
// RÉFÉRENTIELS DE MATIÈRES
// ==========================================

const GENERIC_S5: SubjectDef[] = [
  { key: 'gen5_m1', label: 'Matière Fondamentale 1', credits: 4, coef: 4, ue: 'UE5-1' },
  { key: 'gen5_m2', label: 'Matière Fondamentale 2', credits: 4, coef: 4, ue: 'UE5-1' },
  { key: 'gen5_m3', label: 'Méthodologie', credits: 2, coef: 2, ue: 'UE5-1' },
  { key: 'gen5_m4', label: 'Option de Spécialité 1', credits: 3, coef: 3, ue: 'UE5-2' },
  { key: 'gen5_m5', label: 'Option de Spécialité 2', credits: 3, coef: 3, ue: 'UE5-2' },
  { key: 'gen5_langue', label: 'Langue vivante', credits: 2, coef: 2, ue: 'UE5-3' },
];

const GENERIC_S6: SubjectDef[] = [
  { key: 'gen6_m1', label: 'Matière Fondamentale 3', credits: 4, coef: 4, ue: 'UE6-1' },
  { key: 'gen6_m2', label: 'Matière Fondamentale 4', credits: 4, coef: 4, ue: 'UE6-1' },
  { key: 'gen6_m3', label: 'Projet tuteuré', credits: 4, coef: 4, ue: 'UE6-2' },
  { key: 'gen6_stage', label: 'Stage et Soutenance', credits: 6, coef: 6, ue: 'UE6-3' },
];

// Fonction pour récupérer les matières. Si la classe n'est pas définie, on retourne le modèle générique.
export const getSubjects = (classeKey: ClasseKey | null | undefined, sem: 's5' | 's6'): SubjectDef[] => {
  if (!classeKey) return sem === 's5' ? GENERIC_S5 : GENERIC_S6;
  const def = MATIERES_BY_CLASSE[classeKey];
  if (def) return def[sem];
  // Placeholder pour les classes non définies explicitement
  return sem === 's5' ? GENERIC_S5 : GENERIC_S6;
};

/**
 * Initialise les notes avec -1 pour signifier "pas de note saisie".
 * Cela permet de distinguer un vrai 0/20 (note éliminatoire) d'une note absente.
 */
export const buildEmptyGrades = (classeKey: ClasseKey | null | undefined, sem: 's5' | 's6'): Record<string, number> => {
  const subjects = getSubjects(classeKey, sem);
  const grades: Record<string, number> = { moyenne: 0 };
  subjects.forEach(s => {
    grades[s.key] = -1; // -1 = pas de note saisie
  });
  return grades;
};

/** Indique si une valeur de note représente une note réellement saisie (>= 0) */
export const isGradeSet = (v: number | undefined): boolean =>
  typeof v === 'number' && v >= 0;
