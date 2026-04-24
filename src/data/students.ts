export type S5Grades = {
  anglais: number; management: number; communication: number; droit: number;
  gestionProjets: number; veille: number; programmation: number; bdd: number;
  ios: number; lan: number; scripts: number; virtualisation: number;
  clientServeur: number; telephonie: number; svaa: number; moyenne: number;
};

export type S6Grades = {
  windows: number; linux: number; interop: number; cryptage: number;
  prevention: number; accesDistant: number; ccna3: number;
  methodologie: number; soutenance: number; moyenne: number;
};

export type Student = {
  matricule: string;
  nom: string;
  prenom: string;
  dateNaissance?: string | null;
  lieuNaissance?: string | null;
  bac?: string | null;
  etablissement?: string | null;
  s5: S5Grades;
  s6: S6Grades;
  moyenneGenerale: number;
};

export const S5_SUBJECTS = [
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
] as const;

export const S6_SUBJECTS = [
  { key: 'windows', label: 'Environnement Windows', credits: 3, coef: 3, ue: 'UE6-1' },
  { key: 'linux', label: 'Environnement Linux', credits: 3, coef: 3, ue: 'UE6-1' },
  { key: 'interop', label: 'Interopérabilité', credits: 3, coef: 3, ue: 'UE6-1' },
  { key: 'cryptage', label: 'Cryptage et Authentification', credits: 2, coef: 2, ue: 'UE6-1' },
  { key: 'prevention', label: 'Prévention et Sécurité', credits: 3, coef: 3, ue: 'UE6-1' },
  { key: 'accesDistant', label: "Contrôle d'accès distant", credits: 2, coef: 2, ue: 'UE6-1' },
  { key: 'ccna3', label: 'CCNA3', credits: 1, coef: 1, ue: 'UE6-1' },
  { key: 'methodologie', label: 'Méthodologie de rédaction du rapport de stage', credits: 2, coef: 2, ue: 'UE6-2' },
  { key: 'soutenance', label: 'Soutenance', credits: 8, coef: 8, ue: 'UE6-2' },
] as const;

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
  // Règles §4.7 du cahier des charges
  if (student) {
    const credS5 = getCreditsS5(student);
    const credS6 = getCreditsS6(student);
    const ue62Subjects = S6_SUBJECTS.filter((x) => x.ue === 'UE6-2');
    const totalCoefUE62 = ue62Subjects.reduce((a, b) => a + b.coef, 0);
    const moyUE62 =
      ue62Subjects.reduce(
        (a, b) => a + (student.s6[b.key as keyof S6Grades] as number) * b.coef,
        0
      ) / totalCoefUE62;
    const ue62Acquise = moyUE62 >= 10 || s6 >= 10;

    if (moyGen >= 10 && s5 >= 10 && s6 >= 10)
      return { label: 'Diplômé(e)', type: 'admis' };
    if (moyGen >= 10)
      return { label: 'Admis(e) par compensation', type: 'compensation' };
    if (!ue62Acquise && credS5 >= 30 && credS6 >= 22)
      return { label: 'Reprise de soutenance', type: 'reprise' };
    return { label: 'Redouble la Licence 3', type: 'refuse' };
  }
  if (moyGen >= 10 && s5 >= 10 && s6 >= 10) return { label: 'Diplômé(e)', type: 'admis' };
  if (moyGen >= 10) return { label: 'Admis(e) par compensation', type: 'compensation' };
  return { label: 'Redouble la Licence 3', type: 'refuse' };
};

export const getCreditsS5 = (s: Student): number => {
  const ue51Subjects = S5_SUBJECTS.filter(x => x.ue === 'UE5-1');
  const ue52Subjects = S5_SUBJECTS.filter(x => x.ue === 'UE5-2');
  const moyUE = (subjects: typeof S5_SUBJECTS[number][]) => {
    const totalCoef = subjects.reduce((a, b) => a + b.coef, 0);
    const sum = subjects.reduce((a, b) => a + (s.s5[b.key as keyof S5Grades] as number) * b.coef, 0);
    return sum / totalCoef;
  };
  let credits = 0;
  if (moyUE(ue51Subjects as any) >= 10 || s.s5.moyenne >= 10) credits += 13;
  if (moyUE(ue52Subjects as any) >= 10 || s.s5.moyenne >= 10) credits += 17;
  return credits;
};

export const getCreditsS6 = (s: Student): number => {
  const ue61Subjects = S6_SUBJECTS.filter(x => x.ue === 'UE6-1');
  const ue62Subjects = S6_SUBJECTS.filter(x => x.ue === 'UE6-2');
  const moyUE = (subjects: typeof S6_SUBJECTS[number][]) => {
    const totalCoef = subjects.reduce((a, b) => a + b.coef, 0);
    const sum = subjects.reduce((a, b) => a + (s.s6[b.key as keyof S6Grades] as number) * b.coef, 0);
    return sum / totalCoef;
  };
  let credits = 0;
  if (moyUE(ue61Subjects as any) >= 10 || s.s6.moyenne >= 10) credits += 17;
  if (moyUE(ue62Subjects as any) >= 10 || s.s6.moyenne >= 10) credits += 13;
  return credits;
};
