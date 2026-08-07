import type { Departement, Classe } from "@/types/university";

/**
 * Définition d'une matière (unité d'enseignement).
 */
export type SubjectDef = {
  key: string; // Code unique de la matière (ex: "RSN301")
  label: string; // Libellé complet (ex: "Administration Systèmes")
  credits: number; // Nombre de crédits ECTS
  coef: number; // Coefficient
  ue: string; // Code de l'Unité d'Enseignement parente (ex: "UEF3.1")
  semestre: "S1" | "S2" | "S3" | "S4" | "S5" | "S6";
};

/**
 * Structure de données contenant toutes les matières, indexées par département puis par classe.
 * Exemple d'accès : SUBJECTS['RSN']['L3']
 */
export type SubjectsMap = {
  [dept in Departement]: {
    [cls in Classe]: SubjectDef[];
  };
};

export const SUBJECTS: SubjectsMap = {
  // =================================================================
  // Réseaux et Systèmes Numériques (RSN)
  // =================================================================
  RSN: {
    L1: [
      { key: "RSN101", label: "Algorithmique & Programmation 1", credits: 6, coef: 3, ue: "UEF1.1", semestre: "S1" },
      { key: "RSN102", label: "Architecture des Ordinateurs", credits: 5, coef: 2, ue: "UEF1.1", semestre: "S1" },
      { key: "RSN103", label: "Systèmes Logiques", credits: 5, coef: 2, ue: "UEF1.1", semestre: "S1" },
      { key: "RSN104", label: "Mathématiques pour l'Ingénieur 1", credits: 6, coef: 3, ue: "UEF1.2", semestre: "S1" },
      { key: "RSN105", label: "Physique Appliquée", credits: 4, coef: 2, ue: "UEF1.2", semestre: "S1" },
      { key: "RSN106", label: "Anglais Technique 1", credits: 2, coef: 1, ue: "UET1.1", semestre: "S1" },
      { key: "RSN107", label: "Techniques d'Expression 1", credits: 2, coef: 1, ue: "UET1.1", semestre: "S1" },

      { key: "RSN201", label: "Algorithmique & Programmation 2", credits: 6, coef: 3, ue: "UEF2.1", semestre: "S2" },
      { key: "RSN202", label: "Introduction aux Réseaux", credits: 5, coef: 2, ue: "UEF2.1", semestre: "S2" },
      { key: "RSN203", label: "Systèmes d'Exploitation 1", credits: 5, coef: 2, ue: "UEF2.1", semestre: "S2" },
      { key: "RSN204", label: "Mathématiques pour l'Ingénieur 2", credits: 6, coef: 3, ue: "UEF2.2", semestre: "S2" },
      { key: "RSN205", label: "Électronique Numérique", credits: 4, coef: 2, ue: "UEF2.2", semestre: "S2" },
      { key: "RSN206", label: "Anglais Technique 2", credits: 2, coef: 1, ue: "UET2.1", semestre: "S2" },
      { key: "RSN207", label: "Projet Tuteuré 1", credits: 2, coef: 1, ue: "UET2.1", semestre: "S2" },
    ],
    L2: [
      { key: "RSN301", label: "Programmation Orientée Objet", credits: 6, coef: 3, ue: "UEF3.1", semestre: "S3" },
      { key: "RSN302", label: "Réseaux TCP/IP", credits: 5, coef: 2, ue: "UEF3.1", semestre: "S3" },
      { key: "RSN303", label: "Systèmes d'Exploitation 2 (Linux)", credits: 5, coef: 2, ue: "UEF3.1", semestre: "S3" },
      { key: "RSN304", label: "Bases de Données", credits: 6, coef: 3, ue: "UEF3.2", semestre: "S3" },
      { key: "RSN305", label: "Probabilités et Statistiques", credits: 4, coef: 2, ue: "UEF3.2", semestre: "S3" },
      { key: "RSN306", label: "Anglais Professionnel 1", credits: 2, coef: 1, ue: "UET3.1", semestre: "S3" },
      { key: "RSN307", label: "Droit de l'Informatique", credits: 2, coef: 1, ue: "UET3.1", semestre: "S3" },

      { key: "RSN401", label: "Développement Web (Frontend)", credits: 5, coef: 2, ue: "UEF4.1", semestre: "S4" },
      { key: "RSN402", label: "Administration Réseaux", credits: 6, coef: 3, ue: "UEF4.1", semestre: "S4" },
      { key: "RSN403", label: "Sécurité des Systèmes", credits: 5, coef: 2, ue: "UEF4.1", semestre: "S4" },
      { key: "RSN404", label: "Développement Web (Backend)", credits: 6, coef: 3, ue: "UEF4.2", semestre: "S4" },
      { key: "RSN405", label: "Gestion de Projet", credits: 4, coef: 2, ue: "UEF4.2", semestre: "S4" },
      { key: "RSN406", label: "Anglais Professionnel 2", credits: 2, coef: 1, ue: "UET4.1", semestre: "S4" },
      { key: "RSN407", label: "Projet Tuteuré 2", credits: 2, coef: 1, ue: "UET4.1", semestre: "S4" },
    ],
    L3: [
      // Semestre 5 (données existantes)
      { key: "RSN501", label: "Administration Systèmes", credits: 6, coef: 3, ue: "UEF5.1", semestre: "S5" },
      { key: "RSN502", label: "Réseaux Mobiles et Sans-fil", credits: 6, coef: 3, ue: "UEF5.1", semestre: "S5" },
      { key: "RSN503", label: "Qualité de Service", credits: 4, coef: 2, ue: "UEF5.1", semestre: "S5" },
      { key: "RSN504", label: "Développement Web Avancé", credits: 5, coef: 2, ue: "UEF5.2", semestre: "S5" },
      { key: "RSN505", label: "Virtualisation", credits: 5, coef: 2, ue: "UEF5.2", semestre: "S5" },
      { key: "RSN506", label: "Anglais 5", credits: 2, coef: 1, ue: "UET5.1", semestre: "S5" },
      { key: "RSN507", label: "Droit et Économie", credits: 2, coef: 1, ue: "UET5.1", semestre: "S5" },

      // Semestre 6 (données existantes)
      { key: "RSN601", label: "Sécurité des Réseaux", credits: 6, coef: 3, ue: "UEF6.1", semestre: "S6" },
      { key: "RSN602", label: "Supervision", credits: 5, coef: 2, ue: "UEF6.1", semestre: "S6" },
      { key: "RSN603", label: "Voix sur IP", credits: 5, coef: 2, ue: "UEF6.1", semestre: "S6" },
      { key: "RSN604", label: "Projet Tuteuré", credits: 8, coef: 4, ue: "UEP6.1", semestre: "S6" },
      { key: "RSN605", label: "Stage", credits: 6, coef: 3, ue: "UEP6.1", semestre: "S6" },
    ],
  },

  // =================================================================
  // Management des TIC (MTIC)
  // =================================================================
  MTIC: {
    L1: [
      { key: "MTIC101", label: "Introduction au Management", credits: 6, coef: 3, ue: "UEF1.1", semestre: "S1" },
      { key: "MTIC102", label: "Économie Générale", credits: 5, coef: 2, ue: "UEF1.1", semestre: "S1" },
      { key: "MTIC103", label: "Outils Informatiques 1", credits: 5, coef: 2, ue: "UEF1.1", semestre: "S1" },
      { key: "MTIC104", label: "Mathématiques Financières", credits: 6, coef: 3, ue: "UEF1.2", semestre: "S1" },
      { key: "MTIC105", label: "Comptabilité Générale", credits: 4, coef: 2, ue: "UEF1.2", semestre: "S1" },
      { key: "MTIC106", label: "Anglais des Affaires 1", credits: 2, coef: 1, ue: "UET1.1", semestre: "S1" },
      { key: "MTIC107", label: "Communication d'Entreprise 1", credits: 2, coef: 1, ue: "UET1.1", semestre: "S1" },

      { key: "MTIC201", label: "Principes de Marketing", credits: 6, coef: 3, ue: "UEF2.1", semestre: "S2" },
      { key: "MTIC202", label: "Droit Commercial", credits: 5, coef: 2, ue: "UEF2.1", semestre: "S2" },
      { key: "MTIC203", label: "Outils Informatiques 2", credits: 5, coef: 2, ue: "UEF2.1", semestre: "S2" },
      { key: "MTIC204", label: "Statistiques Descriptives", credits: 6, coef: 3, ue: "UEF2.2", semestre: "S2" },
      { key: "MTIC205", label: "Analyse Financière", credits: 4, coef: 2, ue: "UEF2.2", semestre: "S2" },
      { key: "MTIC206", label: "Anglais des Affaires 2", credits: 2, coef: 1, ue: "UET2.1", semestre: "S2" },
      { key: "MTIC207", label: "Projet de Création d'Entreprise", credits: 2, coef: 1, ue: "UET2.1", semestre: "S2" },
    ],
    L2: [
      { key: "MTIC301", label: "Management Stratégique", credits: 6, coef: 3, ue: "UEF3.1", semestre: "S3" },
      { key: "MTIC302", label: "Marketing Digital", credits: 5, coef: 2, ue: "UEF3.1", semestre: "S3" },
      { key: "MTIC303", label: "Systèmes d'Information", credits: 5, coef: 2, ue: "UEF3.1", semestre: "S3" },
      { key: "MTIC304", label: "Gestion des Ressources Humaines", credits: 6, coef: 3, ue: "UEF3.2", semestre: "S3" },
      { key: "MTIC305", label: "Contrôle de Gestion", credits: 4, coef: 2, ue: "UEF3.2", semestre: "S3" },
      { key: "MTIC306", label: "Anglais Professionnel 1", credits: 2, coef: 1, ue: "UET3.1", semestre: "S3" },
      { key: "MTIC307", label: "Veille Technologique", credits: 2, coef: 1, ue: "UET3.1", semestre: "S3" },

      { key: "MTIC401", label: "E-commerce", credits: 5, coef: 2, ue: "UEF4.1", semestre: "S4" },
      { key: "MTIC402", label: "Management de l'Innovation", credits: 6, coef: 3, ue: "UEF4.1", semestre: "S4" },
      { key: "MTIC403", label: "Business Intelligence", credits: 5, coef: 2, ue: "UEF4.1", semestre: "S4" },
      { key: "MTIC404", label: "Gestion de Projet Agile", credits: 6, coef: 3, ue: "UEF4.2", semestre: "S4" },
      { key: "MTIC405", label: "Négociation Commerciale", credits: 4, coef: 2, ue: "UEF4.2", semestre: "S4" },
      { key: "MTIC406", label: "Anglais Professionnel 2", credits: 2, coef: 1, ue: "UET4.1", semestre: "S4" },
      { key: "MTIC407", label: "Projet Tuteuré 2", credits: 2, coef: 1, ue: "UET4.1", semestre: "S4" },
    ],
    L3: [
      { key: "MTIC501", label: "Transformation Digitale", credits: 6, coef: 3, ue: "UEF5.1", semestre: "S5" },
      { key: "MTIC502", label: "Analyse de Données (Big Data)", credits: 6, coef: 3, ue: "UEF5.1", semestre: "S5" },
      { key: "MTIC503", label: "Cybersécurité & Gouvernance", credits: 4, coef: 2, ue: "UEF5.1", semestre: "S5" },
      { key: "MTIC504", label: "Cloud Computing & Business", credits: 5, coef: 2, ue: "UEF5.2", semestre: "S5" },
      { key: "MTIC505", label: "Fintech", credits: 5, coef: 2, ue: "UEF5.2", semestre: "S5" },
      { key: "MTIC506", label: "Anglais 5", credits: 2, coef: 1, ue: "UET5.1", semestre: "S5" },
      { key: "MTIC507", label: "Entrepreneuriat", credits: 2, coef: 1, ue: "UET5.1", semestre: "S5" },

      { key: "MTIC601", label: "Management de Projet SI", credits: 6, coef: 3, ue: "UEF6.1", semestre: "S6" },
      { key: "MTIC602", label: "Stratégie CRM", credits: 5, coef: 2, ue: "UEF6.1", semestre: "S6" },
      { key: "MTIC603", label: "Droit du Numérique", credits: 5, coef: 2, ue: "UEF6.1", semestre: "S6" },
      { key: "MTIC604", label: "Projet Tuteuré", credits: 8, coef: 4, ue: "UEP6.1", semestre: "S6" },
      { key: "MTIC605", label: "Stage", credits: 6, coef: 3, ue: "UEP6.1", semestre: "S6" },
    ],
  },

  // =================================================================
  // Audio-visuel (AV)
  // =================================================================
  AV: {
    L1: [
      { key: "AV101", label: "Histoire du Cinéma", credits: 6, coef: 3, ue: "UEF1.1", semestre: "S1" },
      { key: "AV102", label: "Initiation à la Prise de Vue", credits: 5, coef: 2, ue: "UEF1.1", semestre: "S1" },
      { key: "AV103", label: "Théorie du Son", credits: 5, coef: 2, ue: "UEF1.1", semestre: "S1" },
      { key: "AV104", label: "Analyse de l'Image", credits: 6, coef: 3, ue: "UEF1.2", semestre: "S1" },
      { key: "AV105", label: "Écriture de Scénario 1", credits: 4, coef: 2, ue: "UEF1.2", semestre: "S1" },
      { key: "AV106", label: "Anglais de l'Audiovisuel 1", credits: 2, coef: 1, ue: "UET1.1", semestre: "S1" },
      { key: "AV107", label: "Culture Artistique", credits: 2, coef: 1, ue: "UET1.1", semestre: "S1" },

      { key: "AV201", label: "Techniques de Montage 1", credits: 6, coef: 3, ue: "UEF2.1", semestre: "S2" },
      { key: "AV202", label: "Prise de Son", credits: 5, coef: 2, ue: "UEF2.1", semestre: "S2" },
      { key: "AV203", label: "Lumière et Éclairage", credits: 5, coef: 2, ue: "UEF2.1", semestre: "S2" },
      { key: "AV204", label: "Écriture de Scénario 2", credits: 6, coef: 3, ue: "UEF2.2", semestre: "S2" },
      { key: "AV205", label: "Production Audiovisuelle 1", credits: 4, coef: 2, ue: "UEF2.2", semestre: "S2" },
      { key: "AV206", label: "Anglais de l'Audiovisuel 2", credits: 2, coef: 1, ue: "UET2.1", semestre: "S2" },
      { key: "AV207", label: "Projet Court-Métrage 1", credits: 2, coef: 1, ue: "UET2.1", semestre: "S2" },
    ],
    L2: [
      { key: "AV301", label: "Réalisation 1", credits: 6, coef: 3, ue: "UEF3.1", semestre: "S3" },
      { key: "AV302", label: "Montage Avancé", credits: 5, coef: 2, ue: "UEF3.1", semestre: "S3" },
      { key: "AV303", label: "Mixage Son", credits: 5, coef: 2, ue: "UEF3.1", semestre: "S3" },
      { key: "AV304", label: "Direction de la Photographie", credits: 6, coef: 3, ue: "UEF3.2", semestre: "S3" },
      { key: "AV305", label: "Effets Spéciaux (VFX) 1", credits: 4, coef: 2, ue: "UEF3.2", semestre: "S3" },
      { key: "AV306", label: "Anglais Professionnel 1", credits: 2, coef: 1, ue: "UET3.1", semestre: "S3" },
      { key: "AV307", label: "Droit de l'Audiovisuel", credits: 2, coef: 1, ue: "UET3.1", semestre: "S3" },

      { key: "AV401", label: "Réalisation 2 (Documentaire)", credits: 5, coef: 2, ue: "UEF4.1", semestre: "S4" },
      { key: "AV402", label: "Étalonnage", credits: 6, coef: 3, ue: "UEF4.1", semestre: "S4" },
      { key: "AV403", label: "Sound Design", credits: 5, coef: 2, ue: "UEF4.1", semestre: "S4" },
      { key: "AV404", label: "Production Audiovisuelle 2", credits: 6, coef: 3, ue: "UEF4.2", semestre: "S4" },
      { key: "AV405", label: "Effets Spéciaux (VFX) 2", credits: 4, coef: 2, ue: "UEF4.2", semestre: "S4" },
      { key: "AV406", label: "Anglais Professionnel 2", credits: 2, coef: 1, ue: "UET4.1", semestre: "S4" },
      { key: "AV407", label: "Projet Court-Métrage 2", credits: 2, coef: 1, ue: "UET4.1", semestre: "S4" },
    ],
    L3: [
      { key: "AV501", label: "Direction d'Acteurs", credits: 6, coef: 3, ue: "UEF5.1", semestre: "S5" },
      { key: "AV502", label: "Réalisation Publicitaire", credits: 6, coef: 3, ue: "UEF5.1", semestre: "S5" },
      { key: "AV503", label: "Motion Design", credits: 4, coef: 2, ue: "UEF5.1", semestre: "S5" },
      { key: "AV504", label: "Post-production Avancée", credits: 5, coef: 2, ue: "UEF5.2", semestre: "S5" },
      { key: "AV505", label: "Distribution et Diffusion", credits: 5, coef: 2, ue: "UEF5.2", semestre: "S5" },
      { key: "AV506", label: "Anglais 5", credits: 2, coef: 1, ue: "UET5.1", semestre: "S5" },
      { key: "AV507", label: "Analyse de Marché", credits: 2, coef: 1, ue: "UET5.1", semestre: "S5" },

      { key: "AV601", label: "Réalisation de Fiction", credits: 6, coef: 3, ue: "UEF6.1", semestre: "S6" },
      { key: "AV602", label: "Son Immersif", credits: 5, coef: 2, ue: "UEF6.1", semestre: "S6" },
      { key: "AV603", label: "Nouvelles Écritures", credits: 5, coef: 2, ue: "UEF6.1", semestre: "S6" },
      { key: "AV604", label: "Projet de Fin d'Études", credits: 8, coef: 4, ue: "UEP6.1", semestre: "S6" },
      { key: "AV605", label: "Stage", credits: 6, coef: 3, ue: "UEP6.1", semestre: "S6" },
    ],
  },
};

/**
 * Récupère la liste des matières pour un département et une classe donnés.
 * @param dept Le département (ex: 'RSN')
 * @param cls La classe (ex: 'L3')
 * @returns Un tableau de SubjectDef ou un tableau vide si la combinaison n'existe pas.
 */
export const getSubjects = (
  dept: Departement | null | undefined,
  cls: Classe | null | undefined
): SubjectDef[] => {
  if (!dept || !cls) {
    return [];
  }
  return SUBJECTS[dept]?.[cls] ?? [];
};
