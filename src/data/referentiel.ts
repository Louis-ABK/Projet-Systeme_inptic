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

export const DEPARTEMENTS: Departement[] = [
  { code: 'MTIC', libelle: 'Management des TIC', filieres: ['TC', 'MD'] },
  { code: 'RSN', libelle: 'Réseaux et Systèmes Numériques', filieres: ['GI', 'RT'] },
  { code: 'AV', libelle: 'Audio-Visuel', filieres: ['JO', 'VD', 'AU'] },
];

export const FILIERES_MAP: Record<string, { libelle: string; dept: string }> = {
  'TC': { libelle: 'Technique Commercial', dept: 'MTIC' },
  'MD': { libelle: 'Marketing Digital', dept: 'MTIC' },
  'GI': { libelle: 'Génie Informatique', dept: 'RSN' },
  'RT': { libelle: 'Réseaux et Télécommunication', dept: 'RSN' },
  'JO': { libelle: 'Journalisme', dept: 'AV' },
  'VD': { libelle: 'Vidéo', dept: 'AV' },
  'AU': { libelle: 'Audio', dept: 'AV' },
};

// ==========================================
// RÉFÉRENTIELS DE MATIÈRES
// ==========================================

// Matières spécifiques pour GI-L3 (anciennement considérées comme ASUR)
const GI_L3_S5: SubjectDef[] = [
  { key: 'anglais', label: 'Anglais technique', credits: 2, coef: 1, ue: 'UE5-1' },
  { key: 'management', label: "Management d'équipe", credits: 1, coef: 1, ue: 'UE5-1' },
  { key: 'communication', label: 'Communication', credits: 1, coef: 2, ue: 'UE5-1' },
  { key: 'droit', label: "Droit de l'informatique", credits: 2, coef: 2, ue: 'UE5-1' },
  { key: 'gestionProjets', label: 'Gestion de projets', credits: 1, coef: 1, ue: 'UE5-1' },
  { key: 'veille', label: 'Veille technologique', credits: 1, coef: 1, ue: 'UE5-1' },
  { key: 'programmation', label: 'Consolidation des bases de la programmation', credits: 2, coef: 2, ue: 'UE5-1' },
  { key: 'bdd', label: 'Conception BDD et langage SQL', credits: 2, coef: 2, ue: 'UE5-1' },
  { key: 'ios', label: 'Remise à niveau IOS', credits: 2, coef: 2, ue: 'UE5-2' },
  { key: 'lan', label: 'Connaissance des réseaux LAN', credits: 2, coef: 2, ue: 'UE5-2' },
  { key: 'scripts', label: 'Les langages du script', credits: 2, coef: 2, ue: 'UE5-2' },
  { key: 'virtualisation', label: 'Virtualisation', credits: 3, coef: 3, ue: 'UE5-2' },
  { key: 'clientServeur', label: 'Application client-serveur', credits: 2, coef: 2, ue: 'UE5-2' },
  { key: 'telephonie', label: 'Téléphonie IP avancée', credits: 2, coef: 2, ue: 'UE5-2' },
  { key: 'svaa', label: 'Services à valeur ajoutée', credits: 2, coef: 2, ue: 'UE5-2' },
];

const GI_L3_S6: SubjectDef[] = [
  { key: 'windows', label: 'Environnement Windows', credits: 3, coef: 3, ue: 'UE6-1' },
  { key: 'linux', label: 'Environnement Linux', credits: 3, coef: 3, ue: 'UE6-1' },
  { key: 'interop', label: 'Interopérabilité', credits: 3, coef: 3, ue: 'UE6-1' },
  { key: 'cryptage', label: 'Cryptage et Authentification', credits: 2, coef: 2, ue: 'UE6-1' },
  { key: 'prevention', label: 'Prévention et Sécurité', credits: 3, coef: 3, ue: 'UE6-1' },
  { key: 'accesDistant', label: "Contrôle d'accès distant", credits: 2, coef: 2, ue: 'UE6-1' },
  { key: 'ccna3', label: 'CCNA3', credits: 1, coef: 1, ue: 'UE6-1' },
  { key: 'methodologie', label: 'Méthodologie de rédaction du rapport de stage', credits: 2, coef: 2, ue: 'UE6-2' },
  { key: 'soutenance', label: 'Soutenance', credits: 8, coef: 8, ue: 'UE6-2' },
];

// Matières génériques pour les autres filières/niveaux
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

export const MATIERES_BY_CLASSE: Record<ClasseKey, { s5: SubjectDef[]; s6: SubjectDef[] }> = {
  'GI-L3': { s5: GI_L3_S5, s6: GI_L3_S6 },
};

// Fonction pour récupérer les matières. Si la classe n'est pas définie, on retourne le modèle générique.
export const getSubjects = (classeKey: ClasseKey | null | undefined, sem: 's5' | 's6'): SubjectDef[] => {
  if (!classeKey) return sem === 's5' ? GENERIC_S5 : GENERIC_S6;
  const def = MATIERES_BY_CLASSE[classeKey];
  if (def) return def[sem];
  // Placeholder pour les classes non définies explicitement
  return sem === 's5' ? GENERIC_S5 : GENERIC_S6;
};

export const buildEmptyGrades = (classeKey: ClasseKey | null | undefined, sem: 's5' | 's6'): Record<string, number> => {
  const subjects = getSubjects(classeKey, sem);
  const grades: Record<string, number> = { moyenne: 0 };
  subjects.forEach(s => {
    grades[s.key] = 0;
  });
  return grades;
};
