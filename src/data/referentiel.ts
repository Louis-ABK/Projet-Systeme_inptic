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

// Matières spécifiques pour GI-L3 (anciennement considérées comme ASUR)
const GI_L3_S5: SubjectDef[] = [
  { key: 'anglais', label: 'Anglais technique', credits: 2, coef: 1, ue: 'UE5-1' },
  { key: 'management', label: "Management d'équipe", credits: 1, coef: 1, ue: 'UE5-1' },
  { key: 'communication', label: 'Communication', credits: 1, coef: 2, ue: 'UE5-1' },
  { key: 'droit', label: "Droit de l'informatique", credits: 2, coef: 2, ue: 'UE5-1' },
  { key: 'gestionProjets', label: 'Gestion de projets', credits: 1, coef: 1, ue: 'UE5-1' },
  { key: 'veille', label: 'Veille technologique', credits: 1, coef: 1, ue: 'UE5-1' },
  { key: 'programmation', label: 'Consolidation des bases de la programmation', credits: 3, coef: 2, ue: 'UE5-1' },
  { key: 'bdd', label: 'Conception BDD et langage SQL', credits: 3, coef: 2, ue: 'UE5-1' },
  { key: 'ios', label: 'Remise à niveau IOS', credits: 2, coef: 2, ue: 'UE5-2' },
  { key: 'lan', label: 'Connaissance des réseaux LAN', credits: 2, coef: 2, ue: 'UE5-2' },
  { key: 'scripts', label: 'Les langages du script', credits: 2, coef: 2, ue: 'UE5-2' },
  { key: 'virtualisation', label: 'Virtualisation', credits: 3, coef: 3, ue: 'UE5-2' },
  { key: 'clientServeur', label: 'Application client-serveur', credits: 3, coef: 2, ue: 'UE5-2' },
  { key: 'telephonie', label: 'Téléphonie IP avancée', credits: 2, coef: 2, ue: 'UE5-2' },
  { key: 'svaa', label: 'Services à valeur ajoutée', credits: 2, coef: 2, ue: 'UE5-2' },
];

const GI_L3_S6: SubjectDef[] = [
  { key: 'windows', label: 'Environnement Windows', credits: 3, coef: 3, ue: 'UE6-1' },
  { key: 'linux', label: 'Environnement Linux', credits: 3, coef: 3, ue: 'UE6-1' },
  { key: 'interop', label: 'Intéropérabilité', credits: 3, coef: 3, ue: 'UE6-1' },
  { key: 'cryptage', label: 'Cryptage et Authentification', credits: 2, coef: 2, ue: 'UE6-1' },
  { key: 'prevention', label: 'Prévention et Sécurité', credits: 3, coef: 3, ue: 'UE6-1' },
  { key: 'accesDistant', label: "Contrôle d'accès distant", credits: 2, coef: 2, ue: 'UE6-1' },
  { key: 'ccna3', label: 'CCNA3', credits: 1, coef: 1, ue: 'UE6-1' },
  // UE6-2 = 13 crédits pour atteindre le total de 30 (17+13=30)
  { key: 'methodologie', label: 'Méthodologie de rédaction du rapport de stage', credits: 2, coef: 2, ue: 'UE6-2' },
  { key: 'soutenance', label: 'Soutenance', credits: 11, coef: 8, ue: 'UE6-2' },
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


const TC_L1_S5: SubjectDef[] = [
  { key: 'tc_l1_marketing', label: 'Marketing Fondamental', credits: 4, coef: 4, ue: 'UE1-1' },
  { key: 'tc_l1_compta', label: 'Comptabilite Generale', credits: 3, coef: 3, ue: 'UE1-1' },
  { key: 'tc_l1_droit', label: 'Droit des affaires', credits: 3, coef: 3, ue: 'UE1-2' },
  { key: 'tc_l1_eco', label: 'Economie Generale', credits: 2, coef: 2, ue: 'UE1-2' },
  { key: 'tc_l1_maths', label: 'Mathematiques appliquees', credits: 2, coef: 2, ue: 'UE1-3' }
];

const TC_L1_S6: SubjectDef[] = [
  { key: 'tc_l1_negociation', label: 'Techniques de Negociation', credits: 4, coef: 4, ue: 'UE2-1' },
  { key: 'tc_l1_vente', label: 'Force de Vente', credits: 3, coef: 3, ue: 'UE2-1' },
  { key: 'tc_l1_info', label: 'Informatique de Gestion', credits: 3, coef: 3, ue: 'UE2-2' },
  { key: 'tc_l1_anglais', label: 'Anglais Commercial', credits: 2, coef: 2, ue: 'UE2-3' },
  { key: 'tc_l1_stage', label: 'Stage immersion', credits: 3, coef: 3, ue: 'UE2-3' }
];

const TC_L2_S5: SubjectDef[] = [
  { key: 'mat_tc_l2_1', label: 'Introduction au TC 1', credits: 4, coef: 4, ue: 'UE3-1' },
  { key: 'mat_tc_l2_2', label: 'Bases théoriques TC', credits: 3, coef: 3, ue: 'UE3-1' },
  { key: 'mat_tc_l2_3', label: 'Pratique TC 1', credits: 3, coef: 3, ue: 'UE3-2' },
  { key: 'mat_tc_l2_4', label: 'Culture générale', credits: 2, coef: 2, ue: 'UE3-3' },
];

const TC_L2_S6: SubjectDef[] = [
  { key: 'mat_tc_l2_5', label: 'Introduction au TC 2', credits: 4, coef: 4, ue: 'UE4-1' },
  { key: 'mat_tc_l2_6', label: 'Méthodes avancées TC', credits: 3, coef: 3, ue: 'UE4-1' },
  { key: 'mat_tc_l2_7', label: 'Pratique TC 2', credits: 3, coef: 3, ue: 'UE4-2' },
  { key: 'mat_tc_l2_8', label: 'Projet / Stage', credits: 4, coef: 4, ue: 'UE4-3' },
];

const TC_L3_S5: SubjectDef[] = [
  { key: 'mat_tc_l3_1', label: 'Introduction au TC 1', credits: 4, coef: 4, ue: 'UE5-1' },
  { key: 'mat_tc_l3_2', label: 'Bases théoriques TC', credits: 3, coef: 3, ue: 'UE5-1' },
  { key: 'mat_tc_l3_3', label: 'Pratique TC 1', credits: 3, coef: 3, ue: 'UE5-2' },
  { key: 'mat_tc_l3_4', label: 'Culture générale', credits: 2, coef: 2, ue: 'UE5-3' },
];

const TC_L3_S6: SubjectDef[] = [
  { key: 'mat_tc_l3_5', label: 'Introduction au TC 2', credits: 4, coef: 4, ue: 'UE6-1' },
  { key: 'mat_tc_l3_6', label: 'Méthodes avancées TC', credits: 3, coef: 3, ue: 'UE6-1' },
  { key: 'mat_tc_l3_7', label: 'Pratique TC 2', credits: 3, coef: 3, ue: 'UE6-2' },
  { key: 'mat_tc_l3_8', label: 'Projet / Stage', credits: 4, coef: 4, ue: 'UE6-3' },
];

const MD_L1_S5: SubjectDef[] = [
  { key: 'mat_md_l1_1', label: 'Introduction au MD 1', credits: 4, coef: 4, ue: 'UE1-1' },
  { key: 'mat_md_l1_2', label: 'Bases théoriques MD', credits: 3, coef: 3, ue: 'UE1-1' },
  { key: 'mat_md_l1_3', label: 'Pratique MD 1', credits: 3, coef: 3, ue: 'UE1-2' },
  { key: 'mat_md_l1_4', label: 'Culture générale', credits: 2, coef: 2, ue: 'UE1-3' },
];

const MD_L1_S6: SubjectDef[] = [
  { key: 'mat_md_l1_5', label: 'Introduction au MD 2', credits: 4, coef: 4, ue: 'UE2-1' },
  { key: 'mat_md_l1_6', label: 'Méthodes avancées MD', credits: 3, coef: 3, ue: 'UE2-1' },
  { key: 'mat_md_l1_7', label: 'Pratique MD 2', credits: 3, coef: 3, ue: 'UE2-2' },
  { key: 'mat_md_l1_8', label: 'Projet / Stage', credits: 4, coef: 4, ue: 'UE2-3' },
];

const MD_L2_S5: SubjectDef[] = [
  { key: 'md_l2_seo', label: 'SEO et Referencement', credits: 4, coef: 4, ue: 'UE3-1' },
  { key: 'md_l2_social', label: 'Social Media Management', credits: 4, coef: 4, ue: 'UE3-1' },
  { key: 'md_l2_content', label: 'Content Marketing', credits: 3, coef: 3, ue: 'UE3-2' },
  { key: 'md_l2_data', label: 'Analyse de donnees / Web Analytics', credits: 3, coef: 3, ue: 'UE3-2' }
];

const MD_L2_S6: SubjectDef[] = [
  { key: 'md_l2_email', label: 'Emailing et CRM', credits: 4, coef: 4, ue: 'UE4-1' },
  { key: 'md_l2_pub', label: 'Publicite Digitale / SEA', credits: 4, coef: 4, ue: 'UE4-1' },
  { key: 'md_l2_droit_num', label: 'Droit du Numerique', credits: 3, coef: 3, ue: 'UE4-2' },
  { key: 'md_l2_projet', label: 'Projet Tuteure', credits: 4, coef: 4, ue: 'UE4-3' }
];

const MD_L3_S5: SubjectDef[] = [
  { key: 'mat_md_l3_1', label: 'Introduction au MD 1', credits: 4, coef: 4, ue: 'UE5-1' },
  { key: 'mat_md_l3_2', label: 'Bases théoriques MD', credits: 3, coef: 3, ue: 'UE5-1' },
  { key: 'mat_md_l3_3', label: 'Pratique MD 1', credits: 3, coef: 3, ue: 'UE5-2' },
  { key: 'mat_md_l3_4', label: 'Culture générale', credits: 2, coef: 2, ue: 'UE5-3' },
];

const MD_L3_S6: SubjectDef[] = [
  { key: 'mat_md_l3_5', label: 'Introduction au MD 2', credits: 4, coef: 4, ue: 'UE6-1' },
  { key: 'mat_md_l3_6', label: 'Méthodes avancées MD', credits: 3, coef: 3, ue: 'UE6-1' },
  { key: 'mat_md_l3_7', label: 'Pratique MD 2', credits: 3, coef: 3, ue: 'UE6-2' },
  { key: 'mat_md_l3_8', label: 'Projet / Stage', credits: 4, coef: 4, ue: 'UE6-3' },
];

const RT_L1_S5: SubjectDef[] = [
  { key: 'mat_rt_l1_1', label: 'Introduction au RT 1', credits: 4, coef: 4, ue: 'UE1-1' },
  { key: 'mat_rt_l1_2', label: 'Bases théoriques RT', credits: 3, coef: 3, ue: 'UE1-1' },
  { key: 'mat_rt_l1_3', label: 'Pratique RT 1', credits: 3, coef: 3, ue: 'UE1-2' },
  { key: 'mat_rt_l1_4', label: 'Culture générale', credits: 2, coef: 2, ue: 'UE1-3' },
];

const RT_L1_S6: SubjectDef[] = [
  { key: 'mat_rt_l1_5', label: 'Introduction au RT 2', credits: 4, coef: 4, ue: 'UE2-1' },
  { key: 'mat_rt_l1_6', label: 'Méthodes avancées RT', credits: 3, coef: 3, ue: 'UE2-1' },
  { key: 'mat_rt_l1_7', label: 'Pratique RT 2', credits: 3, coef: 3, ue: 'UE2-2' },
  { key: 'mat_rt_l1_8', label: 'Projet / Stage', credits: 4, coef: 4, ue: 'UE2-3' },
];

const RT_L2_S5: SubjectDef[] = [
  { key: 'mat_rt_l2_1', label: 'Introduction au RT 1', credits: 4, coef: 4, ue: 'UE3-1' },
  { key: 'mat_rt_l2_2', label: 'Bases théoriques RT', credits: 3, coef: 3, ue: 'UE3-1' },
  { key: 'mat_rt_l2_3', label: 'Pratique RT 1', credits: 3, coef: 3, ue: 'UE3-2' },
  { key: 'mat_rt_l2_4', label: 'Culture générale', credits: 2, coef: 2, ue: 'UE3-3' },
];

const RT_L2_S6: SubjectDef[] = [
  { key: 'mat_rt_l2_5', label: 'Introduction au RT 2', credits: 4, coef: 4, ue: 'UE4-1' },
  { key: 'mat_rt_l2_6', label: 'Méthodes avancées RT', credits: 3, coef: 3, ue: 'UE4-1' },
  { key: 'mat_rt_l2_7', label: 'Pratique RT 2', credits: 3, coef: 3, ue: 'UE4-2' },
  { key: 'mat_rt_l2_8', label: 'Projet / Stage', credits: 4, coef: 4, ue: 'UE4-3' },
];

const RT_L3_S5: SubjectDef[] = [
  { key: 'rt_l3_routage', label: 'Routage Avance', credits: 4, coef: 4, ue: 'UE5-1' },
  { key: 'rt_l3_sans_fil', label: 'Reseaux Sans Fil', credits: 4, coef: 4, ue: 'UE5-1' },
  { key: 'rt_l3_secu', label: 'Securite des Reseaux', credits: 3, coef: 3, ue: 'UE5-2' },
  { key: 'rt_l3_voip', label: 'Telephonie sur IP', credits: 3, coef: 3, ue: 'UE5-2' }
];

const RT_L3_S6: SubjectDef[] = [
  { key: 'rt_l3_admin', label: 'Administration Systemes', credits: 4, coef: 4, ue: 'UE6-1' },
  { key: 'rt_l3_cloud', label: 'Cloud et Virtualisation', credits: 4, coef: 4, ue: 'UE6-1' },
  { key: 'rt_l3_supervision', label: 'Supervision Reseaux', credits: 3, coef: 3, ue: 'UE6-2' },
  { key: 'rt_l3_stage', label: 'Stage et Soutenance', credits: 6, coef: 6, ue: 'UE6-3' }
];

const JO_L1_S5: SubjectDef[] = [
  { key: 'jo_l1_intro', label: 'Introduction au Journalisme', credits: 4, coef: 4, ue: 'UE1-1' },
  { key: 'jo_l1_ecriture', label: 'Techniques Redactionnelles', credits: 4, coef: 4, ue: 'UE1-1' },
  { key: 'jo_l1_droit_presse', label: 'Droit de la Presse', credits: 3, coef: 3, ue: 'UE1-2' },
  { key: 'jo_l1_histoire', label: 'Histoire des Medias', credits: 3, coef: 3, ue: 'UE1-2' }
];

const JO_L1_S6: SubjectDef[] = [
  { key: 'jo_l1_itw', label: 'Techniques Interview', credits: 4, coef: 4, ue: 'UE2-1' },
  { key: 'jo_l1_web', label: 'Journalisme Web', credits: 4, coef: 4, ue: 'UE2-1' },
  { key: 'jo_l1_photo', label: 'Photojournalisme', credits: 3, coef: 3, ue: 'UE2-2' },
  { key: 'jo_l1_anglais', label: 'Anglais pour Journalistes', credits: 3, coef: 3, ue: 'UE2-3' }
];

const JO_L2_S5: SubjectDef[] = [
  { key: 'mat_jo_l2_1', label: 'Introduction au JO 1', credits: 4, coef: 4, ue: 'UE3-1' },
  { key: 'mat_jo_l2_2', label: 'Bases théoriques JO', credits: 3, coef: 3, ue: 'UE3-1' },
  { key: 'mat_jo_l2_3', label: 'Pratique JO 1', credits: 3, coef: 3, ue: 'UE3-2' },
  { key: 'mat_jo_l2_4', label: 'Culture générale', credits: 2, coef: 2, ue: 'UE3-3' },
];

const JO_L2_S6: SubjectDef[] = [
  { key: 'mat_jo_l2_5', label: 'Introduction au JO 2', credits: 4, coef: 4, ue: 'UE4-1' },
  { key: 'mat_jo_l2_6', label: 'Méthodes avancées JO', credits: 3, coef: 3, ue: 'UE4-1' },
  { key: 'mat_jo_l2_7', label: 'Pratique JO 2', credits: 3, coef: 3, ue: 'UE4-2' },
  { key: 'mat_jo_l2_8', label: 'Projet / Stage', credits: 4, coef: 4, ue: 'UE4-3' },
];

const JO_L3_S5: SubjectDef[] = [
  { key: 'mat_jo_l3_1', label: 'Introduction au JO 1', credits: 4, coef: 4, ue: 'UE5-1' },
  { key: 'mat_jo_l3_2', label: 'Bases théoriques JO', credits: 3, coef: 3, ue: 'UE5-1' },
  { key: 'mat_jo_l3_3', label: 'Pratique JO 1', credits: 3, coef: 3, ue: 'UE5-2' },
  { key: 'mat_jo_l3_4', label: 'Culture générale', credits: 2, coef: 2, ue: 'UE5-3' },
];

const JO_L3_S6: SubjectDef[] = [
  { key: 'mat_jo_l3_5', label: 'Introduction au JO 2', credits: 4, coef: 4, ue: 'UE6-1' },
  { key: 'mat_jo_l3_6', label: 'Méthodes avancées JO', credits: 3, coef: 3, ue: 'UE6-1' },
  { key: 'mat_jo_l3_7', label: 'Pratique JO 2', credits: 3, coef: 3, ue: 'UE6-2' },
  { key: 'mat_jo_l3_8', label: 'Projet / Stage', credits: 4, coef: 4, ue: 'UE6-3' },
];

const VD_L1_S5: SubjectDef[] = [
  { key: 'mat_vd_l1_1', label: 'Introduction au VD 1', credits: 4, coef: 4, ue: 'UE1-1' },
  { key: 'mat_vd_l1_2', label: 'Bases théoriques VD', credits: 3, coef: 3, ue: 'UE1-1' },
  { key: 'mat_vd_l1_3', label: 'Pratique VD 1', credits: 3, coef: 3, ue: 'UE1-2' },
  { key: 'mat_vd_l1_4', label: 'Culture générale', credits: 2, coef: 2, ue: 'UE1-3' },
];

const VD_L1_S6: SubjectDef[] = [
  { key: 'mat_vd_l1_5', label: 'Introduction au VD 2', credits: 4, coef: 4, ue: 'UE2-1' },
  { key: 'mat_vd_l1_6', label: 'Méthodes avancées VD', credits: 3, coef: 3, ue: 'UE2-1' },
  { key: 'mat_vd_l1_7', label: 'Pratique VD 2', credits: 3, coef: 3, ue: 'UE2-2' },
  { key: 'mat_vd_l1_8', label: 'Projet / Stage', credits: 4, coef: 4, ue: 'UE2-3' },
];

const VD_L2_S5: SubjectDef[] = [
  { key: 'mat_vd_l2_1', label: 'Introduction au VD 1', credits: 4, coef: 4, ue: 'UE3-1' },
  { key: 'mat_vd_l2_2', label: 'Bases théoriques VD', credits: 3, coef: 3, ue: 'UE3-1' },
  { key: 'mat_vd_l2_3', label: 'Pratique VD 1', credits: 3, coef: 3, ue: 'UE3-2' },
  { key: 'mat_vd_l2_4', label: 'Culture générale', credits: 2, coef: 2, ue: 'UE3-3' },
];

const VD_L2_S6: SubjectDef[] = [
  { key: 'mat_vd_l2_5', label: 'Introduction au VD 2', credits: 4, coef: 4, ue: 'UE4-1' },
  { key: 'mat_vd_l2_6', label: 'Méthodes avancées VD', credits: 3, coef: 3, ue: 'UE4-1' },
  { key: 'mat_vd_l2_7', label: 'Pratique VD 2', credits: 3, coef: 3, ue: 'UE4-2' },
  { key: 'mat_vd_l2_8', label: 'Projet / Stage', credits: 4, coef: 4, ue: 'UE4-3' },
];

const VD_L3_S5: SubjectDef[] = [
  { key: 'vd_l3_realisation', label: 'Realisation Avancee', credits: 4, coef: 4, ue: 'UE5-1' },
  { key: 'vd_l3_montage', label: 'Techniques de Montage et VFX', credits: 4, coef: 4, ue: 'UE5-1' },
  { key: 'vd_l3_son', label: 'Prise de Son et Mixage', credits: 3, coef: 3, ue: 'UE5-2' },
  { key: 'vd_l3_prod', label: 'Gestion de Production Audiovisuelle', credits: 3, coef: 3, ue: 'UE5-2' }
];

const VD_L3_S6: SubjectDef[] = [
  { key: 'vd_l3_etalonnage', label: 'Etalonnage et Colorimetrie', credits: 4, coef: 4, ue: 'UE6-1' },
  { key: 'vd_l3_diffusion', label: 'Normes de Diffusion', credits: 3, coef: 3, ue: 'UE6-1' },
  { key: 'vd_l3_projet_film', label: 'Projet de Court Metrage', credits: 4, coef: 4, ue: 'UE6-2' },
  { key: 'vd_l3_stage', label: 'Stage Professionnel', credits: 6, coef: 6, ue: 'UE6-3' }
];

const AU_L1_S5: SubjectDef[] = [
  { key: 'mat_au_l1_1', label: 'Introduction au AU 1', credits: 4, coef: 4, ue: 'UE1-1' },
  { key: 'mat_au_l1_2', label: 'Bases théoriques AU', credits: 3, coef: 3, ue: 'UE1-1' },
  { key: 'mat_au_l1_3', label: 'Pratique AU 1', credits: 3, coef: 3, ue: 'UE1-2' },
  { key: 'mat_au_l1_4', label: 'Culture générale', credits: 2, coef: 2, ue: 'UE1-3' },
];

const AU_L1_S6: SubjectDef[] = [
  { key: 'mat_au_l1_5', label: 'Introduction au AU 2', credits: 4, coef: 4, ue: 'UE2-1' },
  { key: 'mat_au_l1_6', label: 'Méthodes avancées AU', credits: 3, coef: 3, ue: 'UE2-1' },
  { key: 'mat_au_l1_7', label: 'Pratique AU 2', credits: 3, coef: 3, ue: 'UE2-2' },
  { key: 'mat_au_l1_8', label: 'Projet / Stage', credits: 4, coef: 4, ue: 'UE2-3' },
];

const AU_L2_S5: SubjectDef[] = [
  { key: 'mat_au_l2_1', label: 'Introduction au AU 1', credits: 4, coef: 4, ue: 'UE3-1' },
  { key: 'mat_au_l2_2', label: 'Bases théoriques AU', credits: 3, coef: 3, ue: 'UE3-1' },
  { key: 'mat_au_l2_3', label: 'Pratique AU 1', credits: 3, coef: 3, ue: 'UE3-2' },
  { key: 'mat_au_l2_4', label: 'Culture générale', credits: 2, coef: 2, ue: 'UE3-3' },
];

const AU_L2_S6: SubjectDef[] = [
  { key: 'mat_au_l2_5', label: 'Introduction au AU 2', credits: 4, coef: 4, ue: 'UE4-1' },
  { key: 'mat_au_l2_6', label: 'Méthodes avancées AU', credits: 3, coef: 3, ue: 'UE4-1' },
  { key: 'mat_au_l2_7', label: 'Pratique AU 2', credits: 3, coef: 3, ue: 'UE4-2' },
  { key: 'mat_au_l2_8', label: 'Projet / Stage', credits: 4, coef: 4, ue: 'UE4-3' },
];

const AU_L3_S5: SubjectDef[] = [
  { key: 'mat_au_l3_1', label: 'Introduction au AU 1', credits: 4, coef: 4, ue: 'UE5-1' },
  { key: 'mat_au_l3_2', label: 'Bases théoriques AU', credits: 3, coef: 3, ue: 'UE5-1' },
  { key: 'mat_au_l3_3', label: 'Pratique AU 1', credits: 3, coef: 3, ue: 'UE5-2' },
  { key: 'mat_au_l3_4', label: 'Culture générale', credits: 2, coef: 2, ue: 'UE5-3' },
];

const AU_L3_S6: SubjectDef[] = [
  { key: 'mat_au_l3_5', label: 'Introduction au AU 2', credits: 4, coef: 4, ue: 'UE6-1' },
  { key: 'mat_au_l3_6', label: 'Méthodes avancées AU', credits: 3, coef: 3, ue: 'UE6-1' },
  { key: 'mat_au_l3_7', label: 'Pratique AU 2', credits: 3, coef: 3, ue: 'UE6-2' },
  { key: 'mat_au_l3_8', label: 'Projet / Stage', credits: 4, coef: 4, ue: 'UE6-3' },
];

export const MATIERES_BY_CLASSE: Record<ClasseKey, { s5: SubjectDef[]; s6: SubjectDef[] }> = {
  'GI-L3': { s5: GI_L3_S5, s6: GI_L3_S6 },
  'TC-L1': { s5: TC_L1_S5, s6: TC_L1_S6 },
  'TC-L2': { s5: TC_L2_S5, s6: TC_L2_S6 },
  'TC-L3': { s5: TC_L3_S5, s6: TC_L3_S6 },
  'MD-L1': { s5: MD_L1_S5, s6: MD_L1_S6 },
  'MD-L2': { s5: MD_L2_S5, s6: MD_L2_S6 },
  'MD-L3': { s5: MD_L3_S5, s6: MD_L3_S6 },
  'RT-L1': { s5: RT_L1_S5, s6: RT_L1_S6 },
  'RT-L2': { s5: RT_L2_S5, s6: RT_L2_S6 },
  'RT-L3': { s5: RT_L3_S5, s6: RT_L3_S6 },
  'JO-L1': { s5: JO_L1_S5, s6: JO_L1_S6 },
  'JO-L2': { s5: JO_L2_S5, s6: JO_L2_S6 },
  'JO-L3': { s5: JO_L3_S5, s6: JO_L3_S6 },
  'VD-L1': { s5: VD_L1_S5, s6: VD_L1_S6 },
  'VD-L2': { s5: VD_L2_S5, s6: VD_L2_S6 },
  'VD-L3': { s5: VD_L3_S5, s6: VD_L3_S6 },
  'AU-L1': { s5: AU_L1_S5, s6: AU_L1_S6 },
  'AU-L2': { s5: AU_L2_S5, s6: AU_L2_S6 },
  'AU-L3': { s5: AU_L3_S5, s6: AU_L3_S6 },
};

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
