/**
 * Récupération des étudiants + notes depuis Supabase.
 * Reconstruit la structure Student attendue par les composants existants.
 *
 * Règle de calcul de la note finale par matière :
 *  - Si CC + Examen : base = CC*0.4 + Examen*0.6
 *  - Sinon : la note disponible (Examen seul, CC seul, ou Rattrapage seul)
 *  - Si Rattrapage présent : note finale = max(base, Rattrapage)
 */
import { supabase } from "@/integrations/supabase/client";
import {
  Student,
  S5Grades,
  S6Grades,
  S5_SUBJECTS,
  S6_SUBJECTS,
} from "@/data/students";

const buildEmptyS5 = (): S5Grades => {
  const o: any = { moyenne: 0 };
  S5_SUBJECTS.forEach((s) => (o[s.key] = 0));
  return o as S5Grades;
};
const buildEmptyS6 = (): S6Grades => {
  const o: any = { moyenne: 0 };
  S6_SUBJECTS.forEach((s) => (o[s.key] = 0));
  return o as S6Grades;
};

const computeMoy = (
  grades: Record<string, number>,
  subjects: readonly { key: string; coef: number }[]
): number => {
  let sum = 0,
    coef = 0;
  subjects.forEach((s) => {
    const v = grades[s.key];
    if (typeof v === "number" && !isNaN(v) && v > 0) {
      sum += v * s.coef;
      coef += s.coef;
    }
  });
  return coef ? +(sum / coef).toFixed(2) : 0;
};

type EvalEntry = { cc?: number; examen?: number; rattrapage?: number };

const finalNoteForSubject = (e: EvalEntry): number => {
  const hasCC = typeof e.cc === "number" && !isNaN(e.cc);
  const hasEx = typeof e.examen === "number" && !isNaN(e.examen);
  const hasRat = typeof e.rattrapage === "number" && !isNaN(e.rattrapage);

  let base: number | null = null;
  if (hasCC && hasEx) base = e.cc! * 0.4 + e.examen! * 0.6;
  else if (hasEx) base = e.examen!;
  else if (hasCC) base = e.cc!;

  if (hasRat && base !== null) return Math.max(base, e.rattrapage!);
  if (hasRat) return e.rattrapage!;
  return base ?? 0;
};

export const fetchStudents = async (): Promise<Student[]> => {
  const [
    { data: etudiants, error: eErr },
    { data: matieres, error: mErr },
    { data: evaluations, error: vErr },
  ] = await Promise.all([
    supabase
      .from("etudiants")
      .select(
        "id, matricule, nom, prenom, date_naissance, lieu_naissance, bac, etablissement"
      )
      .order("matricule"),
    supabase.from("matieres").select("id, code"),
    supabase.from("evaluations").select("etudiant_id, matiere_id, note, type"),
  ]);

  if (eErr) throw eErr;
  if (mErr) throw mErr;
  if (vErr) throw vErr;

  const codeById = new Map<string, string>();
  (matieres ?? []).forEach((m: any) => codeById.set(m.id, m.code));

  // Pour chaque étudiant : map code -> {cc, examen, rattrapage}
  const evalByStudent = new Map<string, Map<string, EvalEntry>>();
  (evaluations ?? []).forEach((ev: any) => {
    const code = codeById.get(ev.matiere_id);
    if (!code) return;
    if (!evalByStudent.has(ev.etudiant_id))
      evalByStudent.set(ev.etudiant_id, new Map());
    const m = evalByStudent.get(ev.etudiant_id)!;
    const cur = m.get(code) || {};
    const note = Number(ev.note);
    if (ev.type === "cc") cur.cc = note;
    else if (ev.type === "examen") cur.examen = note;
    else if (ev.type === "rattrapage") cur.rattrapage = note;
    m.set(code, cur);
  });

  const s5Codes = new Set(S5_SUBJECTS.map((s) => s.key));
  const s6Codes = new Set(S6_SUBJECTS.map((s) => s.key));

  const students: Student[] = (etudiants ?? []).map((e: any) => {
    const s5: any = buildEmptyS5();
    const s6: any = buildEmptyS6();
    const notes = evalByStudent.get(e.id);
    if (notes) {
      notes.forEach((entry, code) => {
        const finale = finalNoteForSubject(entry);
        if (s5Codes.has(code as any)) s5[code] = finale;
        else if (s6Codes.has(code as any)) s6[code] = finale;
      });
    }
    s5.moyenne = computeMoy(s5, S5_SUBJECTS as any);
    s6.moyenne = computeMoy(s6, S6_SUBJECTS as any);
    let moyenneGenerale = 0;
    if (s5.moyenne > 0 && s6.moyenne > 0)
      moyenneGenerale = +((s5.moyenne + s6.moyenne) / 2).toFixed(2);
    else if (s5.moyenne > 0) moyenneGenerale = s5.moyenne;
    else if (s6.moyenne > 0) moyenneGenerale = s6.moyenne;
    return {
      matricule: e.matricule,
      nom: e.nom,
      prenom: e.prenom,
      dateNaissance: e.date_naissance,
      lieuNaissance: e.lieu_naissance,
      bac: e.bac,
      etablissement: e.etablissement,
      s5,
      s6,
      moyenneGenerale,
    };
  });

  return students;
};

export const fetchStudentByMatricule = async (
  matricule: string
): Promise<Student | null> => {
  const all = await fetchStudents();
  return all.find((s) => s.matricule === matricule) ?? null;
};
