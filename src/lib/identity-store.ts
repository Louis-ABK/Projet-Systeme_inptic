/**
 * Store partagé pour les informations d'identité étudiant
 * (utilisé à la fois par la Saisie des notes et par les Bulletins).
 */

export type StudentIdentity = {
  nom?: string;
  prenom?: string;
  dateNaissance?: string;
  lieuNaissance?: string;
  bac?: string;
  etablissement?: string;
};

const KEY = "inptic_identity_v2";

const readAll = (): Record<string, StudentIdentity> => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
};

export const loadIdentity = (matricule: string): StudentIdentity => {
  if (!matricule) return {};
  return readAll()[matricule] || {};
};

export const saveIdentity = (matricule: string, data: StudentIdentity) => {
  if (!matricule) return;
  const all = readAll();
  all[matricule] = { ...(all[matricule] || {}), ...data };
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
};
