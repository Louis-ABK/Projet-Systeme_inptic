import * as XLSX from "xlsx";
import { Student, S5_SUBJECTS, S6_SUBJECTS } from "@/data/students";

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

const matchSubjectKey = (
  header: string,
  subjects: readonly { key: string; label: string }[]
): string | null => {
  const h = norm(header);
  if (!h) return null;
  // Essai sur le label (exact ou inclus)
  for (const s of subjects) {
    const nl = norm(s.label);
    if (nl === h) return s.key;
  }
  for (const s of subjects) {
    const nl = norm(s.label);
    if (nl.includes(h) || h.includes(nl)) return s.key;
  }
  // Essai sur la clé
  for (const s of subjects) {
    const nk = norm(s.key);
    if (nk === h || h.includes(nk) || nk.includes(h)) return s.key;
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
  let sum = 0,
    coef = 0;
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
  bac?: string;
  etablissement?: string;
  grades: Record<string, number>;
};

const IDENT_HEADERS = new Set(
  [
    "matricule", "n", "no", "numero", "id",
    "nom", "name", "lastname",
    "prenom", "firstname",
    "etudiant", "student", "nomprenom", "nometprenom",
    // Identity extra (à ne PAS interpréter comme matière)
    "datedenaissance", "datenaissance", "dateneenaissance", "dn", "naissance",
    "lieudenaissance", "lieunaissance", "lieu",
    "bac", "typedebac", "typedubaccalaureat", "baccalaureat", "typebac",
    "etablissement", "etablissementdorigine", "ecole", "lyceedorigine", "lycee",
  ].map(norm)
);

// Convertit une valeur de date Excel (number ou string) en ISO yyyy-mm-dd
const toDateString = (v: any): string => {
  if (v === null || v === undefined || v === "") return "";
  // Excel serial date
  if (typeof v === "number" && v > 1000) {
    // Excel epoch = 1899-12-30
    const ms = Math.round((v - 25569) * 86400 * 1000);
    const d = new Date(ms);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  const s = String(v).trim();
  // Format dd/mm/yyyy ou dd-mm-yyyy
  const m = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (m) {
    let [_, dd, mm, yy] = m;
    if (yy.length === 2) yy = (parseInt(yy) > 30 ? "19" : "20") + yy;
    return `${yy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  // Format yyyy-mm-dd déjà ok
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return s;
};

const findCol = (row: any, candidates: string[]): string => {
  const wanted = candidates.map(norm);
  for (const k of Object.keys(row)) {
    if (wanted.includes(norm(k))) return String(row[k] ?? "").trim();
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
    let nom = findCol(r, ["Nom", "NOM", "Lastname", "Last name"]);
    let prenom = findCol(r, ["Prenom", "Prénom", "PRENOM", "Firstname", "First name"]);
    if (!nom && !prenom) {
      const full = findCol(r, ["Étudiant", "Etudiant", "Nom et Prénom", "Nom Prenom"]);
      if (full) {
        const parts = full.split(/\s+/);
        nom = parts[0] || "";
        prenom = parts.slice(1).join(" ");
      }
    }
    const dateRaw = findCol(r, [
      "Date de naissance", "Date naissance", "DateNaissance", "Né(e) le", "Ne le", "DN", "Naissance",
    ]);
    const dateNaissance = dateRaw ? toDateString(dateRaw) : "";
    const lieuNaissance = findCol(r, [
      "Lieu de naissance", "Lieu naissance", "LieuNaissance", "Lieu",
    ]);
    const bac = findCol(r, [
      "Type de baccalauréat", "Type de baccalaureat", "Type bac", "Bac", "Baccalauréat", "Baccalaureat",
    ]);
    const etablissement = findCol(r, [
      "Établissement d'origine", "Etablissement d'origine", "Établissement", "Etablissement", "École", "Ecole", "Lycée d'origine", "Lycée", "Lycee",
    ]);

    const grades: Record<string, number> = {};
    Object.keys(r).forEach((header) => {
      if (IDENT_HEADERS.has(norm(header))) return;
      if (norm(header).includes("moyenne")) return;
      if (norm(header).includes("naissance")) return;
      if (norm(header).includes("etablissement")) return;
      if (norm(header).includes("bac")) return;
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
        bac: bac || undefined,
        etablissement: etablissement || undefined,
        grades,
      });
    }
  });
  return { rows: out, matched };
};

/** Détermine si une feuille est S5 ou S6 par son nom + contenu */
const detectSemester = (name: string, ws: XLSX.WorkSheet): "s5" | "s6" | null => {
  const n = norm(name);
  if (/(s5|sem.*5|semestre5)/.test(n)) return "s5";
  if (/(s6|sem.*6|semestre6)/.test(n)) return "s6";
  // Heuristique par contenu : compter les matières détectées
  const s5 = parseSheet(ws, S5_SUBJECTS);
  const s6 = parseSheet(ws, S6_SUBJECTS);
  if (s5.matched === 0 && s6.matched === 0) return null;
  return s5.matched >= s6.matched ? "s5" : "s6";
};

/**
 * Importe un ou plusieurs fichiers Excel et fusionne les données.
 * Auto-détection du semestre par nom de feuille OU par contenu.
 */
export const importStudentsFromExcel = async (
  files: File | File[]
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
    bac?: string;
    etablissement?: string;
  };
  const identityMap = new Map<string, Identity>();

  for (const file of list) {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: "array" });
    let fileHadData = false;

    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      const sem = detectSemester(sheetName, ws);
      if (!sem) continue;
      const subjects = sem === "s5" ? S5_SUBJECTS : S6_SUBJECTS;
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
          bac: prev.bac || r.bac,
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

  if (s5Map.size === 0) warnings.push("Aucune donnée Semestre 5 trouvée.");
  if (s6Map.size === 0) warnings.push("Aucune donnée Semestre 6 trouvée.");

  // Fusion : on prend l'union des matricules
  const allKeys = new Set<string>([...s5Map.keys(), ...s6Map.keys()]);
  const students: Student[] = [];

  allKeys.forEach((key) => {
    const id = identityMap.get(key) || { nom: "", prenom: "" };
    const s5Row = s5Map.get(key);
    const s6Row = s6Map.get(key);

    const s5Full: any = { moyenne: 0 };
    S5_SUBJECTS.forEach((s) => {
      s5Full[s.key] = s5Row?.grades[s.key] ?? 0;
    });
    s5Full.moyenne = s5Row ? computeMoyenne(s5Row.grades, S5_SUBJECTS as any) : 0;

    const s6Full: any = { moyenne: 0 };
    S6_SUBJECTS.forEach((s) => {
      s6Full[s.key] = s6Row?.grades[s.key] ?? 0;
    });
    s6Full.moyenne = s6Row ? computeMoyenne(s6Row.grades, S6_SUBJECTS as any) : 0;

    const matricule = (s5Row?.matricule || s6Row?.matricule || key).trim();

    let moyenneGenerale = 0;
    if (s5Row && s6Row) moyenneGenerale = +((s5Full.moyenne + s6Full.moyenne) / 2).toFixed(2);
    else if (s5Row) moyenneGenerale = s5Full.moyenne;
    else if (s6Row) moyenneGenerale = s6Full.moyenne;

    students.push({
      matricule,
      nom: id.nom || s5Row?.nom || s6Row?.nom || "",
      prenom: id.prenom || s5Row?.prenom || s6Row?.prenom || "",
      s5: s5Full,
      s6: s6Full,
      moyenneGenerale,
    });

    if (!s5Row) warnings.push(`${matricule} : pas de notes S5 (mises à 0).`);
    if (!s6Row) warnings.push(`${matricule} : pas de notes S6 (mises à 0).`);
  });

  // Tri par matricule
  students.sort((a, b) => a.matricule.localeCompare(b.matricule));

  return { students, warnings, info };
};
