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

export const STUDENTS: Student[] = [
  {"matricule":"2026GI001","nom":"HOMDOUM","prenom":"Janvier","s5":{"anglais":13.3,"management":5.3,"communication":8.6,"droit":7.9,"gestionProjets":14.6,"veille":13.8,"programmation":16.6,"bdd":6.1,"ios":10.5,"lan":5.4,"scripts":7.8,"virtualisation":11.6,"clientServeur":5.3,"telephonie":7.6,"svaa":13.4,"moyenne":9.85},"s6":{"windows":14.5,"linux":9.1,"interop":12.9,"cryptage":11.6,"prevention":10.0,"accesDistant":12.5,"ccna3":8.3,"methodologie":14.2,"soutenance":5.0,"moyenne":10.9},"moyenneGenerale":10.38},
  {"matricule":"2026GI002","nom":"AKIGHE","prenom":"Max","s5":{"anglais":12.1,"management":7.9,"communication":12.7,"droit":15.5,"gestionProjets":5.1,"veille":15.5,"programmation":14.1,"bdd":9.4,"ios":7.0,"lan":17.4,"scripts":9.4,"virtualisation":6.2,"clientServeur":6.3,"telephonie":16.0,"svaa":12.8,"moyenne":11.16},"s6":{"windows":17.0,"linux":12.0,"interop":14.4,"cryptage":14.6,"prevention":13.7,"accesDistant":9.7,"ccna3":5.9,"methodologie":13.6,"soutenance":9.3,"moyenne":12.24},"moyenneGenerale":11.7},
  {"matricule":"2026GI003","nom":"BAKIENGA","prenom":"Lorline","s5":{"anglais":15.5,"management":14.5,"communication":12.0,"droit":17.7,"gestionProjets":9.9,"veille":12.2,"programmation":15.8,"bdd":13.0,"ios":16.2,"lan":12.5,"scripts":14.2,"virtualisation":5.6,"clientServeur":8.0,"telephonie":8.8,"svaa":6.0,"moyenne":12.13},"s6":{"windows":9.1,"linux":16.0,"interop":14.4,"cryptage":8.9,"prevention":9.0,"accesDistant":10.3,"ccna3":10.2,"methodologie":8.8,"soutenance":6.7,"moyenne":10.38},"moyenneGenerale":11.26},
  {"matricule":"2026GI004","nom":"BOUSSOUGOU","prenom":"Théonis","s5":{"anglais":8.0,"management":6.3,"communication":8.6,"droit":13.3,"gestionProjets":9.7,"veille":9.8,"programmation":7.7,"bdd":8.5,"ios":17.2,"lan":13.4,"scripts":12.9,"virtualisation":7.2,"clientServeur":14.5,"telephonie":7.1,"svaa":9.9,"moyenne":10.27},"s6":{"windows":10.5,"linux":17.2,"interop":13.8,"cryptage":16.7,"prevention":13.0,"accesDistant":8.9,"ccna3":12.1,"methodologie":5.0,"soutenance":8.7,"moyenne":11.77},"moyenneGenerale":11.02},
  {"matricule":"2026GI005","nom":"EKOUAGA","prenom":"Jaël","s5":{"anglais":17.9,"management":13.3,"communication":12.2,"droit":13.9,"gestionProjets":16.0,"veille":15.1,"programmation":8.0,"bdd":5.4,"ios":9.1,"lan":8.5,"scripts":7.7,"virtualisation":17.3,"clientServeur":16.4,"telephonie":9.1,"svaa":13.5,"moyenne":12.23},"s6":{"windows":10.6,"linux":12.5,"interop":13.5,"cryptage":11.0,"prevention":10.7,"accesDistant":7.8,"ccna3":11.2,"methodologie":16.7,"soutenance":15.3,"moyenne":12.14},"moyenneGenerale":12.19},
  {"matricule":"2026GI006","nom":"MADJINOU","prenom":"Prisca","s5":{"anglais":10.1,"management":16.9,"communication":11.0,"droit":8.4,"gestionProjets":8.2,"veille":12.3,"programmation":8.4,"bdd":12.6,"ios":16.7,"lan":10.2,"scripts":7.9,"virtualisation":18.0,"clientServeur":11.6,"telephonie":6.2,"svaa":5.6,"moyenne":10.94},"s6":{"windows":7.2,"linux":6.1,"interop":11.7,"cryptage":13.2,"prevention":9.4,"accesDistant":15.6,"ccna3":14.8,"methodologie":13.7,"soutenance":7.9,"moyenne":11.07},"moyenneGenerale":11.0},
  {"matricule":"2026GI007","nom":"LOUEMBET","prenom":"Jessy","s5":{"anglais":6.4,"management":13.2,"communication":15.3,"droit":10.5,"gestionProjets":5.8,"veille":10.0,"programmation":17.9,"bdd":11.9,"ios":17.6,"lan":16.2,"scripts":5.1,"virtualisation":14.4,"clientServeur":13.9,"telephonie":12.0,"svaa":8.5,"moyenne":11.91},"s6":{"windows":7.6,"linux":5.3,"interop":8.2,"cryptage":11.2,"prevention":16.0,"accesDistant":5.9,"ccna3":10.4,"methodologie":13.2,"soutenance":7.5,"moyenne":9.48},"moyenneGenerale":10.7},
  {"matricule":"2026GI008","nom":"NGUIZI","prenom":"Emmanuellie","s5":{"anglais":13.3,"management":6.5,"communication":10.7,"droit":10.9,"gestionProjets":17.4,"veille":16.4,"programmation":8.4,"bdd":11.5,"ios":7.3,"lan":16.9,"scripts":16.3,"virtualisation":8.9,"clientServeur":13.3,"telephonie":12.9,"svaa":7.0,"moyenne":11.85},"s6":{"windows":14.1,"linux":11.4,"interop":8.2,"cryptage":13.5,"prevention":5.1,"accesDistant":14.8,"ccna3":15.0,"methodologie":6.4,"soutenance":10.5,"moyenne":11.0},"moyenneGenerale":11.43},
  {"matricule":"2026GI009","nom":"OTSINA","prenom":"Jean","s5":{"anglais":14.9,"management":12.0,"communication":15.1,"droit":11.9,"gestionProjets":5.0,"veille":9.2,"programmation":5.3,"bdd":17.1,"ios":16.4,"lan":15.8,"scripts":9.0,"virtualisation":5.8,"clientServeur":16.4,"telephonie":17.3,"svaa":6.1,"moyenne":11.82},"s6":{"windows":7.3,"linux":17.5,"interop":11.7,"cryptage":5.7,"prevention":8.2,"accesDistant":16.0,"ccna3":10.9,"methodologie":15.4,"soutenance":13.7,"moyenne":11.82},"moyenneGenerale":11.82},
  {"matricule":"2026GI010","nom":"MOUBOUENGHOU","prenom":"Merveilles","s5":{"anglais":11.3,"management":5.9,"communication":14.9,"droit":15.0,"gestionProjets":6.7,"veille":11.2,"programmation":12.1,"bdd":8.4,"ios":16.3,"lan":10.5,"scripts":7.8,"virtualisation":12.0,"clientServeur":14.5,"telephonie":7.6,"svaa":9.1,"moyenne":10.89},"s6":{"windows":17.8,"linux":12.7,"interop":17.4,"cryptage":16.6,"prevention":13.0,"accesDistant":14.4,"ccna3":11.6,"methodologie":15.8,"soutenance":12.1,"moyenne":14.6},"moyenneGenerale":12.75},
  {"matricule":"2026GI011","nom":"MOUDACHIROU","prenom":"Ridwane","s5":{"anglais":17.9,"management":13.4,"communication":10.7,"droit":11.7,"gestionProjets":6.6,"veille":7.9,"programmation":9.4,"bdd":12.6,"ios":8.0,"lan":7.9,"scripts":5.9,"virtualisation":13.2,"clientServeur":8.0,"telephonie":16.8,"svaa":16.2,"moyenne":11.08},"s6":{"windows":16.7,"linux":14.7,"interop":11.2,"cryptage":8.4,"prevention":8.2,"accesDistant":13.3,"ccna3":15.0,"methodologie":11.8,"soutenance":13.1,"moyenne":12.49},"moyenneGenerale":11.79},
  {"matricule":"2026GI012","nom":"NGUEMA","prenom":"Herman","s5":{"anglais":5.9,"management":8.1,"communication":13.7,"droit":7.8,"gestionProjets":6.7,"veille":17.2,"programmation":12.4,"bdd":11.1,"ios":15.2,"lan":15.5,"scripts":7.5,"virtualisation":6.3,"clientServeur":10.6,"telephonie":10.5,"svaa":11.1,"moyenne":10.64},"s6":{"windows":8.6,"linux":6.0,"interop":8.7,"cryptage":8.5,"prevention":9.2,"accesDistant":12.0,"ccna3":6.8,"methodologie":8.0,"soutenance":14.0,"moyenne":9.09},"moyenneGenerale":9.87},
  {"matricule":"2026GI013","nom":"ONEWIN","prenom":"Daniel","s5":{"anglais":14.5,"management":13.8,"communication":17.8,"droit":6.3,"gestionProjets":10.2,"veille":9.4,"programmation":16.2,"bdd":8.2,"ios":7.5,"lan":10.8,"scripts":10.5,"virtualisation":8.6,"clientServeur":8.2,"telephonie":17.0,"svaa":10.8,"moyenne":11.32},"s6":{"windows":14.2,"linux":5.8,"interop":10.3,"cryptage":12.1,"prevention":10.4,"accesDistant":7.7,"ccna3":10.5,"methodologie":16.8,"soutenance":12.6,"moyenne":11.16},"moyenneGenerale":11.24},
  {"matricule":"2026GI014","nom":"APINDA","prenom":"Christ","s5":{"anglais":16.2,"management":12.2,"communication":5.7,"droit":18.0,"gestionProjets":15.9,"veille":17.6,"programmation":17.0,"bdd":16.0,"ios":7.2,"lan":11.3,"scripts":7.8,"virtualisation":10.2,"clientServeur":5.8,"telephonie":9.9,"svaa":17.8,"moyenne":12.57},"s6":{"windows":14.0,"linux":16.1,"interop":15.0,"cryptage":9.9,"prevention":5.1,"accesDistant":9.6,"ccna3":14.8,"methodologie":16.1,"soutenance":17.4,"moyenne":13.11},"moyenneGenerale":12.84},
  {"matricule":"2026GI015","nom":"BOUDIANDZA","prenom":"Hans","s5":{"anglais":8.4,"management":15.2,"communication":10.9,"droit":10.5,"gestionProjets":17.4,"veille":17.9,"programmation":12.2,"bdd":14.3,"ios":7.0,"lan":8.9,"scripts":17.6,"virtualisation":12.5,"clientServeur":12.0,"telephonie":14.7,"svaa":5.7,"moyenne":12.35},"s6":{"windows":10.4,"linux":14.7,"interop":12.1,"cryptage":12.8,"prevention":7.9,"accesDistant":7.9,"ccna3":10.7,"methodologie":5.4,"soutenance":9.4,"moyenne":10.14},"moyenneGenerale":11.25},
  {"matricule":"2026GI016","nom":"BOUSSENGUI","prenom":"Jacques","s5":{"anglais":12.6,"management":11.5,"communication":16.1,"droit":7.0,"gestionProjets":17.5,"veille":6.0,"programmation":7.4,"bdd":12.7,"ios":13.8,"lan":8.1,"scripts":6.6,"virtualisation":16.6,"clientServeur":8.2,"telephonie":12.7,"svaa":13.1,"moyenne":11.33},"s6":{"windows":13.8,"linux":10.3,"interop":7.1,"cryptage":11.1,"prevention":6.7,"accesDistant":13.1,"ccna3":5.4,"methodologie":10.1,"soutenance":12.3,"moyenne":9.99},"moyenneGenerale":10.66},
  {"matricule":"2026GI017","nom":"BIGNOUMBA","prenom":"Layka","s5":{"anglais":10.4,"management":12.6,"communication":11.8,"droit":17.2,"gestionProjets":7.7,"veille":14.3,"programmation":8.1,"bdd":10.1,"ios":13.7,"lan":8.9,"scripts":9.1,"virtualisation":14.8,"clientServeur":5.9,"telephonie":11.0,"svaa":18.0,"moyenne":11.57},"s6":{"windows":5.4,"linux":13.4,"interop":6.8,"cryptage":11.0,"prevention":5.7,"accesDistant":9.9,"ccna3":7.8,"methodologie":9.2,"soutenance":14.9,"moyenne":9.34},"moyenneGenerale":10.46},
  {"matricule":"2026GI018","nom":"AYONGA","prenom":"Noëllie","s5":{"anglais":17.9,"management":6.0,"communication":7.8,"droit":8.4,"gestionProjets":17.1,"veille":16.5,"programmation":16.4,"bdd":9.8,"ios":7.1,"lan":15.8,"scripts":14.1,"virtualisation":13.0,"clientServeur":17.8,"telephonie":13.5,"svaa":5.1,"moyenne":12.42},"s6":{"windows":9.9,"linux":14.8,"interop":15.8,"cryptage":8.3,"prevention":6.1,"accesDistant":5.3,"ccna3":12.0,"methodologie":18.0,"soutenance":9.5,"moyenne":11.08},"moyenneGenerale":11.75},
  {"matricule":"2026GI019","nom":"MALEMBA","prenom":"Esther","s5":{"anglais":15.6,"management":8.9,"communication":13.6,"droit":17.2,"gestionProjets":6.7,"veille":6.5,"programmation":6.4,"bdd":12.2,"ios":8.5,"lan":12.9,"scripts":14.3,"virtualisation":7.6,"clientServeur":13.2,"telephonie":8.4,"svaa":11.4,"moyenne":10.89},"s6":{"windows":13.5,"linux":15.2,"interop":13.5,"cryptage":14.8,"prevention":17.3,"accesDistant":7.6,"ccna3":5.3,"methodologie":7.0,"soutenance":6.6,"moyenne":11.2},"moyenneGenerale":11.04},
  {"matricule":"2026GI020","nom":"MAMBA","prenom":"Jasmine","s5":{"anglais":16.8,"management":16.0,"communication":6.2,"droit":10.5,"gestionProjets":8.6,"veille":5.0,"programmation":15.0,"bdd":13.3,"ios":8.4,"lan":14.6,"scripts":12.2,"virtualisation":10.6,"clientServeur":5.1,"telephonie":6.0,"svaa":16.5,"moyenne":10.99},"s6":{"windows":13.7,"linux":12.3,"interop":7.8,"cryptage":14.1,"prevention":15.0,"accesDistant":7.2,"ccna3":12.9,"methodologie":14.7,"soutenance":6.5,"moyenne":11.58},"moyenneGenerale":11.29},
  {"matricule":"2026GI021","nom":"MARIYA","prenom":"Carole","s5":{"anglais":16.8,"management":12.1,"communication":15.8,"droit":12.6,"gestionProjets":6.9,"veille":6.7,"programmation":9.0,"bdd":16.7,"ios":15.3,"lan":16.2,"scripts":16.7,"virtualisation":7.7,"clientServeur":8.2,"telephonie":6.3,"svaa":15.1,"moyenne":12.14},"s6":{"windows":15.7,"linux":17.5,"interop":6.4,"cryptage":5.3,"prevention":9.1,"accesDistant":13.8,"ccna3":17.5,"methodologie":10.2,"soutenance":14.3,"moyenne":12.2},"moyenneGenerale":12.17},
  {"matricule":"2026GI022","nom":"KOBA","prenom":"Andlry","s5":{"anglais":16.5,"management":10.3,"communication":13.1,"droit":7.0,"gestionProjets":17.1,"veille":16.2,"programmation":17.7,"bdd":15.5,"ios":16.5,"lan":5.3,"scripts":14.6,"virtualisation":9.3,"clientServeur":17.1,"telephonie":15.4,"svaa":16.2,"moyenne":13.85},"s6":{"windows":6.0,"linux":14.0,"interop":13.2,"cryptage":6.3,"prevention":15.0,"accesDistant":16.1,"ccna3":12.8,"methodologie":6.6,"soutenance":17.8,"moyenne":11.98},"moyenneGenerale":12.91},
  {"matricule":"2026GI023","nom":"MBA","prenom":"Evann","s5":{"anglais":15.5,"management":8.5,"communication":15.2,"droit":6.4,"gestionProjets":16.3,"veille":16.2,"programmation":7.9,"bdd":15.6,"ios":11.0,"lan":9.0,"scripts":15.3,"virtualisation":8.0,"clientServeur":5.3,"telephonie":7.5,"svaa":9.3,"moyenne":11.13},"s6":{"windows":15.2,"linux":9.5,"interop":10.6,"cryptage":9.8,"prevention":11.6,"accesDistant":9.4,"ccna3":16.0,"methodologie":15.7,"soutenance":6.4,"moyenne":11.58},"moyenneGenerale":11.36},
  {"matricule":"2026GI024","nom":"MBATANE","prenom":"César","s5":{"anglais":16.2,"management":17.6,"communication":8.6,"droit":13.3,"gestionProjets":10.2,"veille":17.8,"programmation":12.0,"bdd":17.2,"ios":6.5,"lan":17.6,"scripts":7.3,"virtualisation":17.5,"clientServeur":8.5,"telephonie":6.4,"svaa":10.6,"moyenne":12.49},"s6":{"windows":17.5,"linux":13.3,"interop":15.8,"cryptage":14.2,"prevention":10.7,"accesDistant":14.5,"ccna3":17.6,"methodologie":8.5,"soutenance":15.5,"moyenne":14.18},"moyenneGenerale":13.34},
];

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
    const totalCredits = credS5 + credS6;
    // Vérifie l'acquisition de l'UE6-2 (Soutenance)
    const ue62Subjects = S6_SUBJECTS.filter((x) => x.ue === 'UE6-2');
    const totalCoefUE62 = ue62Subjects.reduce((a, b) => a + b.coef, 0);
    const moyUE62 =
      ue62Subjects.reduce(
        (a, b) => a + (student.s6[b.key as keyof S6Grades] as number) * b.coef,
        0
      ) / totalCoefUE62;
    const ue62Acquise = moyUE62 >= 10 || s6 >= 10;

    // Admis direct : moyenne annuelle ≥ 10 ET les deux semestres ≥ 10
    if (moyGen >= 10 && s5 >= 10 && s6 >= 10)
      return { label: 'Diplômé(e)', type: 'admis' };
    // Admis par compensation : moyenne annuelle ≥ 10 même si un semestre < 10
    if (moyGen >= 10)
      return { label: 'Admis(e) par compensation', type: 'compensation' };
    // Reprise de soutenance : UE6-2 non acquise mais le reste OK
    if (!ue62Acquise && credS5 >= 30 && credS6 >= 22)
      return { label: 'Reprise de soutenance', type: 'reprise' };
    return { label: 'Redouble la Licence 3', type: 'refuse' };
  }
  if (moyGen >= 10 && s5 >= 10 && s6 >= 10) return { label: 'Diplômé(e)', type: 'admis' };
  if (moyGen >= 10) return { label: 'Admis(e) par compensation', type: 'compensation' };
  return { label: 'Redouble la Licence 3', type: 'refuse' };
};

export const getCreditsS5 = (s: Student): number => {
  // 30 crédits si moyenne >= 10, sinon proportion (simplifié : crédits acquis par UE >= 10)
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
