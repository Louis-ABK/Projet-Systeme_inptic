import * as XLSX from "xlsx";
import { Student, S5_SUBJECTS, S6_SUBJECTS } from "@/data/students";

export type ImportResult = {
  students: Student[];
  warnings: string[];
};

/**
 * Tente de mapper un en-tête Excel à une clé de matière.
 */
const matchSubjectKey = (
  header: string,
  subjects: readonly { key: string; label: string }[]
): string | null => {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
  const h = norm(header);
  // Essai exact sur le label
  for (const s of subjects) {
    if (norm(s.label) === h || norm(s.label).includes(h) || h.includes(norm(s.label))) {
      return s.key;
    }
  }
  // Essai sur la clé
  for (const s of subjects) {
    if (norm(s.key) === h || h.includes(norm(s.key))) return s.key;
  }
  return null;
};

const toNumber = (v: any): number => {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return v;
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? 0 : n;
};

const computeMoyenne = (
  grades: Record<string, number>,
  subjects: readonly { key: string; coef: number }[]
): number => {
  let sum = 0,
    coef = 0;
  subjects.forEach((s) => {
    if (grades[s.key] !== undefined) {
      sum += grades[s.key] * s.coef;
      coef += s.coef;
    }
  });
  return coef ? +(sum / coef).toFixed(2) : 0;
};

/**
 * Importe un fichier Excel (.xlsx) et retourne la liste des étudiants reconstruite.
 * Format attendu : 1 feuille S5 + 1 feuille S6, ou colonnes Matricule/Nom/Prénom + matières.
 */
export const importStudentsFromExcel = async (
  file: File
): Promise<ImportResult> => {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const warnings: string[] = [];

  // Récupère feuilles S5 et S6
  const findSheet = (regex: RegExp) =>
    wb.SheetNames.find((n) => regex.test(n.toLowerCase()));

  const s5Sheet = findSheet(/(s5|sem.*5|semestre.*5)/);
  const s6Sheet = findSheet(/(s6|sem.*6|semestre.*6)/);

  const parseSheet = (
    name: string,
    subjects: readonly { key: string; label: string; coef: number }[]
  ) => {
    const ws = wb.Sheets[name];
    const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: "" });
    return rows.map((r) => {
      // Trouve les colonnes clés
      const matricule = String(
        r.Matricule || r.matricule || r.MATRICULE || r["N°"] || r.id || ""
      ).trim();
      const nom = String(r.Nom || r.nom || r.NOM || "").trim();
      const prenom = String(
        r.Prenom || r.prenom || r["Prénom"] || r.PRENOM || ""
      ).trim();
      const grades: Record<string, number> = {};
      Object.keys(r).forEach((header) => {
        if (
          ["Matricule", "matricule", "MATRICULE", "Nom", "nom", "Prenom", "prenom", "Prénom"].includes(
            header
          )
        )
          return;
        const key = matchSubjectKey(header, subjects);
        if (key) grades[key] = toNumber(r[header]);
      });
      return { matricule, nom, prenom, grades };
    });
  };

  const s5Data = s5Sheet ? parseSheet(s5Sheet, S5_SUBJECTS) : [];
  const s6Data = s6Sheet ? parseSheet(s6Sheet, S6_SUBJECTS) : [];

  if (!s5Sheet) warnings.push("Aucune feuille Semestre 5 trouvée.");
  if (!s6Sheet) warnings.push("Aucune feuille Semestre 6 trouvée.");

  // Fusion par matricule
  const map = new Map<string, Partial<Student>>();
  s5Data.forEach((d) => {
    if (!d.matricule) return;
    const moy = computeMoyenne(d.grades, S5_SUBJECTS as any);
    const s5Full: any = { moyenne: moy };
    S5_SUBJECTS.forEach((s) => (s5Full[s.key] = d.grades[s.key] ?? 0));
    map.set(d.matricule, {
      matricule: d.matricule,
      nom: d.nom,
      prenom: d.prenom,
      s5: s5Full,
    });
  });
  s6Data.forEach((d) => {
    if (!d.matricule) return;
    const moy = computeMoyenne(d.grades, S6_SUBJECTS as any);
    const s6Full: any = { moyenne: moy };
    S6_SUBJECTS.forEach((s) => (s6Full[s.key] = d.grades[s.key] ?? 0));
    const existing = map.get(d.matricule) || { matricule: d.matricule, nom: d.nom, prenom: d.prenom };
    map.set(d.matricule, { ...existing, s6: s6Full });
  });

  const students: Student[] = [];
  map.forEach((s) => {
    if (!s.s5 || !s.s6) {
      warnings.push(`Données incomplètes pour ${s.matricule} (manque S5 ou S6).`);
      return;
    }
    const moyG = +((s.s5!.moyenne + s.s6!.moyenne) / 2).toFixed(2);
    students.push({
      matricule: s.matricule!,
      nom: s.nom!,
      prenom: s.prenom!,
      s5: s.s5!,
      s6: s.s6!,
      moyenneGenerale: moyG,
    });
  });

  return { students, warnings };
};
