import * as XLSX from "xlsx";
import { Student } from "@/data/students";
import { getSubjects, ClasseKey, getSemesterLabels } from "@/data/referentiel";

export type ImportResult = {
  students: Student[];
  warnings: string[];
  info: string[];
};

const norm = (s: string) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

const matchSubjectKey = (header: string, subjects: any[]) => {
  const h = norm(header);
  
  // 1. Exact or include match
  const found = subjects.find(s => h.includes(norm(s.label)) || norm(s.label).includes(h));
  if (found) return found.key;
  
  // 2. Word-level fuzzy matching
  for (const s of subjects) {
    const sl = norm(s.label);
    
    // Extract significant words (length > 3)
    const headerWords = h.split(/[^a-z0-9]+/).filter(w => w.length > 3);
    const labelWords = sl.split(/[^a-z0-9]+/).filter(w => w.length > 3);
    
    // Check if any significant word matches
    for (const hw of headerWords) {
      if (sl.includes(hw)) return s.key;
    }
    for (const lw of labelWords) {
      if (h.includes(lw)) return s.key;
    }
  }
  return null;
};

const toNumber = (v: any): number | null => {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return isNaN(v) ? null : v;
  const cleaned = String(v).replace(",", ".").replace(/[^0-9.\-]/g, "");
  if (!cleaned) return null;
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
};

const computeMoyenne = (
  grades: Record<string, number>,
  subjects: readonly { key: string; coef: number }[]
): number => {
  let sum = 0, coef = 0;
  subjects.forEach((s) => {
    const v = grades[s.key];
    if (typeof v === "number" && !isNaN(v)) {
      sum += v * s.coef;
      coef += s.coef;
    }
  });
  return coef ? +(sum / coef).toFixed(2) : 0;
};

type RowParsed = {
  matricule: string;
  nom: string;
  prenom: string;
  dateNaissance?: string;
  lieuNaissance?: string;
  sexe?: string;
  etablissement?: string;
  grades: Record<string, number>;
};

const IDENT_HEADERS = new Set(
  [
    "matricule", "n", "no", "numero", "id",
    "nom", "name", "lastname",
    "prenom", "firstname",
    "etudiant", "student", "nomprenom", "nometprenom",
    "datedenaissance", "datenaissance", "dateneenaissance", "dn", "naissance",
    "lieudenaissance", "lieunaissance", "lieu",
    "sexe", "genre",
    "etablissement", "etablissementdorigine", "ecole", "lyceedorigine", "lycee",
  ].map(norm)
);

const toDateString = (v: any): string => {
  if (v === null || v === undefined || v === "") return "";
  if (typeof v === "number" && v > 1000) {
    const ms = Math.round((v - 25569) * 86400 * 1000);
    const d = new Date(ms);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  let s = String(v).trim().replace(/\s+/g, ""); // Remove all spaces
  const m = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (m) {
    let [_, dd, mm, yy] = m;
    if (yy.length === 2) yy = (parseInt(yy) > 30 ? "19" : "20") + yy;
    return `${yy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  
  // If we can't parse it reliably to YYYY-MM-DD, return null to avoid Edge Function crashes
  return ""; 
};

const findCol = (row: any, candidates: string[]): string => {
  const normCandidates = candidates.map((c) => String(c).toLowerCase().trim());
  for (const [key, val] of Object.entries(row)) {
    if (normCandidates.includes(String(key).toLowerCase().trim())) {
      return String(val ?? "").trim();
    }
  }
  return "";
};

const parseSheet = (
  ws: XLSX.WorkSheet,
  subjects: readonly { key: string; label: string; coef: number }[]
): { rows: RowParsed[]; matched: number } => {
  const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: "", raw: true });
  let matched = 0;
  const out: RowParsed[] = [];
  rows.forEach((r) => {
    const matricule = findCol(r, ["Matricule", "matricule", "MATRICULE", "N°", "No", "Numéro", "ID"]);
    let nom = findCol(r, ["Nom", "NOM", "nom", "Noms", "noms", "Lastname", "Last name"]);
    let prenom = findCol(r, ["Prenom", "Prénom", "PRENOM", "prenom", "Prénoms", "prenoms", "Firstname", "First name"]);

    if (!nom && !prenom) {
      const full = findCol(r, ["Étudiant", "Etudiant", "Nom et Prénom", "Nom Prenom"]);
      if (full) {
        const parts = full.split(/\s+/);
        nom = parts[0] || "";
        prenom = parts.slice(1).join(" ");
      }
    }
    const dateRaw = findCol(r, ["Date de naissance", "Date naissance", "DateNaissance", "Né(e) le", "Ne le", "DN", "Naissance"]);
    const dateNaissance = dateRaw ? toDateString(dateRaw) : "";
    const lieuNaissance = findCol(r, ["Lieu de naissance", "Lieu naissance", "LieuNaissance", "Lieu"]);
    const sexe = findCol(r, ["Sexe", "Genre", "sexe", "genre"]);
    const etablissement = findCol(r, ["Établissement d'origine", "Etablissement d'origine", "Établissement", "Etablissement", "École", "Ecole", "Lycée d'origine", "Lycée", "Lycee"]);

    const grades: Record<string, number> = {};
    Object.keys(r).forEach((header) => {
      if (IDENT_HEADERS.has(norm(header))) return;
      if (norm(header).includes("moyenne")) return;
      if (norm(header).includes("naissance")) return;
      if (norm(header).includes("etablissement")) return;
      if (norm(header).includes("sexe")) return;
      const key = matchSubjectKey(header, subjects);
      if (key) {
        const v = toNumber(r[header]);
        if (v !== null) {
          grades[key] = v;
          matched++;
        }
      }
    });
    if (matricule || nom || prenom) {
      out.push({
        matricule: matricule.trim(),
        nom: nom.trim(),
        prenom: prenom.trim(),
        dateNaissance: dateNaissance || undefined,
        lieuNaissance: lieuNaissance || undefined,
        sexe: sexe || undefined,
        etablissement: etablissement || undefined,
        grades,
      });
    }
  });
  return { rows: out, matched };
};

/** Détermine si une feuille est S5 ou S6 par son nom + contenu */
const detectSemester = (name: string, ws: XLSX.WorkSheet, classeKey?: ClasseKey | null): "s5" | "s6" | null => {
  const n = norm(name);
  const niveau = classeKey?.split('-')[1];

  if (niveau === 'L1') {
    if (/(s1|sem.*1|semestre1)/.test(n)) return "s5";
    if (/(s2|sem.*2|semestre2)/.test(n)) return "s6";
  } else if (niveau === 'L2') {
    if (/(s3|sem.*3|semestre3)/.test(n)) return "s5";
    if (/(s4|sem.*4|semestre4)/.test(n)) return "s6";
  } else {
    if (/(s5|sem.*5|semestre5)/.test(n)) return "s5";
    if (/(s6|sem.*6|semestre6)/.test(n)) return "s6";
  }
  
  // Fallback heuristique si le nom ne correspond à rien, on teste le contenu
  if (/(s5|sem.*5|semestre5)/.test(n)) return "s5";
  if (/(s6|sem.*6|semestre6)/.test(n)) return "s6";
  
  // Heuristique par contenu : compter les matières détectées
  const s5Subjects = getSubjects(classeKey, "s5");
  const s6Subjects = getSubjects(classeKey, "s6");
  const s5 = parseSheet(ws, s5Subjects);
  const s6 = parseSheet(ws, s6Subjects);
  if (s5.matched === 0 && s6.matched === 0) return null;
  return s5.matched >= s6.matched ? "s5" : "s6";
};

/**
 * Importe un ou plusieurs fichiers Excel et fusionne les données.
 * Auto-détection du semestre par nom de feuille OU par contenu.
 * Supporte les matières dynamiques selon classeKey.
 */
export const importStudentsFromExcel = async (
  files: File | File[],
  classeKey?: ClasseKey | null
): Promise<ImportResult> => {
  const list = Array.isArray(files) ? files : [files];
  const warnings: string[] = [];
  const info: string[] = [];

  const s5Map = new Map<string, RowParsed>();
  const s6Map = new Map<string, RowParsed>();
  type Identity = {
    nom: string;
    prenom: string;
    dateNaissance?: string;
    lieuNaissance?: string;
    sexe?: string;
    etablissement?: string;
  };
  const identityMap = new Map<string, Identity>();

  const niveau = classeKey?.split('-')[1];
  const [labelS5, labelS6] = getSemesterLabels(niveau);

  const s5Subjects = getSubjects(classeKey, "s5");
  const s6Subjects = getSubjects(classeKey, "s6");

  for (const file of list) {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: "array" });
    let fileHadData = false;

    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      const sem = detectSemester(sheetName, ws, classeKey);
      if (!sem) continue;
      const subjects = sem === "s5" ? s5Subjects : s6Subjects;
      const { rows } = parseSheet(ws, subjects);
      const target = sem === "s5" ? s5Map : s6Map;
      let added = 0;
      rows.forEach((r) => {
        const key = r.matricule || `${norm(r.nom)}_${norm(r.prenom)}`;
        if (!key) return;
        target.set(key, r);
        const prev = identityMap.get(key) || { nom: "", prenom: "" };
        identityMap.set(key, {
          nom: prev.nom || r.nom || "",
          prenom: prev.prenom || r.prenom || "",
          dateNaissance: prev.dateNaissance || r.dateNaissance,
          lieuNaissance: prev.lieuNaissance || r.lieuNaissance,
          sexe: prev.sexe || r.sexe,
          etablissement: prev.etablissement || r.etablissement,
        });
        added++;
      });
      if (added > 0) {
        fileHadData = true;
        info.push(`📄 ${file.name} — feuille "${sheetName}" → ${sem.toUpperCase()} (${added} lignes)`);
      }
    }
    if (!fileHadData) {
      warnings.push(`Aucune donnée exploitable dans ${file.name}.`);
    }
  }

  if (s5Map.size === 0) warnings.push(`Aucune donnée ${labelS5} trouvée.`);
  if (s6Map.size === 0) warnings.push(`Aucune donnée ${labelS6} trouvée.`);

  // Fusion : union des matricules
  const allKeys = new Set<string>([...s5Map.keys(), ...s6Map.keys()]);
  const students: Student[] = [];

  allKeys.forEach((key) => {
    const id = identityMap.get(key) || ({ nom: "", prenom: "" } as Identity);
    const s5Row = s5Map.get(key);
    const s6Row = s6Map.get(key);

    // Construire les objets de notes dynamiquement
    const s5Full: Record<string, number> = { moyenne: 0 };
    s5Subjects.forEach((s) => {
      s5Full[s.key] = s5Row?.grades[s.key] ?? 0;
    });
    s5Full.moyenne = s5Row ? computeMoyenne(s5Row.grades, s5Subjects) : 0;

    const s6Full: Record<string, number> = { moyenne: 0 };
    s6Subjects.forEach((s) => {
      s6Full[s.key] = s6Row?.grades[s.key] ?? 0;
    });
    s6Full.moyenne = s6Row ? computeMoyenne(s6Row.grades, s6Subjects) : 0;

    const matricule = (s5Row?.matricule || s6Row?.matricule || key).trim();

    let moyenneGenerale = 0;
    if (s5Row && s6Row) moyenneGenerale = +((s5Full.moyenne + s6Full.moyenne) / 2).toFixed(2);
    else if (s5Row) moyenneGenerale = s5Full.moyenne;
    else if (s6Row) moyenneGenerale = s6Full.moyenne;

    students.push({
      matricule,
      nom: id.nom || s5Row?.nom || s6Row?.nom || "",
      prenom: id.prenom || s5Row?.prenom || s6Row?.prenom || "",
      dateNaissance: id.dateNaissance || s5Row?.dateNaissance || s6Row?.dateNaissance || null,
      lieuNaissance: id.lieuNaissance || s5Row?.lieuNaissance || s6Row?.lieuNaissance || null,
      sexe: id.sexe || s5Row?.sexe || s6Row?.sexe || null,
      etablissement: id.etablissement || s5Row?.etablissement || s6Row?.etablissement || null,
      classeKey: classeKey || undefined,
      s5: s5Full,
      s6: s6Full,
      moyenneGenerale,
    });

    if (!s5Row) warnings.push(`${matricule} : pas de notes ${labelS5} (mises à 0).`);
    if (!s6Row) warnings.push(`${matricule} : pas de notes ${labelS6} (mises à 0).`);
  });

  students.sort((a, b) => a.matricule.localeCompare(b.matricule));

  return { students, warnings, info };
};

export type ListImportResult = {
  students: Pick<Student, "matricule" | "nom" | "prenom" | "dateNaissance" | "lieuNaissance" | "sexe" | "etablissement">[];
  warnings: string[];
  info: string[];
};

/**
 * Importe une liste d'étudiants SANS notes depuis un fichier Excel.
 * Lit toutes les feuilles, extrait uniquement les colonnes d'identité.
 * Si aucun matricule n'est fourni, génère un matricule au format prenom.nom.
 */
export const importStudentListFromExcel = async (
  files: File | File[],
  classeKey?: string | null
): Promise<ListImportResult> => {
  const list = Array.isArray(files) ? files : [files];
  const warnings: string[] = [];
  const info: string[] = [];
  const seen = new Map<string, ListImportResult["students"][0]>();

  for (const file of list) {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: "array" });
    let fileHadData = false;

    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: "", raw: true });
      let added = 0;

      for (const r of rows) {
        let nom = findCol(r, ["Nom", "NOM", "nom", "Noms", "noms", "Lastname", "Last name"]);
        let prenom = findCol(r, ["Prenom", "Prénom", "PRENOM", "prenom", "Prénoms", "prenoms", "Firstname", "First name"]);

        // Si pas de nom/prénom séparés, chercher un champ combiné
        if (!nom && !prenom) {
          const full = findCol(r, ["Étudiant", "Etudiant", "Nom et Prénom", "Nom Prenom"]);
          if (full) {
            const parts = full.split(/\s+/);
            nom = parts[0] || "";
            prenom = parts.slice(1).join(" ");
          }
        }

        if (!nom && !prenom) continue;

        nom = nom.trim();
        prenom = prenom.trim();

        const dateRaw = findCol(r, ["Date de naissance", "Date naissance", "DateNaissance", "dateNaissance", "Né(e) le", "Ne le", "DN"]);
        const dateNaissance = dateRaw ? toDateString(dateRaw) : undefined;
        const lieuNaissance = findCol(r, ["Lieu de naissance", "Lieu naissance", "LieuNaissance", "lieuNaissance", "Lieu"]) || undefined;
        const sexe = findCol(r, ["Sexe", "Genre", "sexe", "genre"]) || undefined;
        const etablissement = findCol(r, ["Établissement", "Etablissement", "etablissement", "École", "Ecole", "Lycée", "Lycee"]) || undefined;

        // Matricule : champ explicite ou auto-génération prenom.nom
        let matricule = findCol(r, ["Matricule", "matricule", "MATRICULE", "ID", "No"]).trim();
        if (!matricule) {
          const slug = (s: string) =>
            String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "");
          matricule = `${slug(prenom)}.${slug(nom)}`;
        }

        if (!matricule) continue;

        seen.set(matricule, {
          matricule,
          nom,
          prenom,
          dateNaissance: dateNaissance || null,
          lieuNaissance: lieuNaissance || null,
          sexe: sexe || null,
          etablissement: etablissement || null,
        });
        added++;
      }

      if (added > 0) {
        fileHadData = true;
        info.push(`📋 ${file.name} — feuille "${sheetName}" → ${added} étudiant(s) trouvé(s)`);
      }
    }

    if (!fileHadData) {
      warnings.push(`Aucune donnée exploitable dans ${file.name}. Vérifiez que les colonnes "nom" et "prenom" existent.`);
    }
  }

  const students = Array.from(seen.values()).sort((a, b) =>
    a.matricule.localeCompare(b.matricule)
  );

  return { students, warnings, info };
};
