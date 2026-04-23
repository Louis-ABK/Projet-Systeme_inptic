/**
 * Récupération des étudiants + notes depuis Supabase.
 * Reconstruit la structure Student attendue par les composants existants.
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
    if (typeof v === "number" && !isNaN(v)) {
      sum += v * s.coef;
      coef += s.coef;
    }
  });
  return coef ? +(sum / coef).toFixed(2) : 0;
};

export const fetchStudents = async (): Promise<Student[]> => {
  const [
    { data: etudiants, error: eErr },
    { data: matieres, error: mErr },
    { data: evaluations, error: vErr },
  ] = await Promise.all([
    supabase.from("etudiants").select("id, matricule, nom, prenom").order("matricule"),
    supabase.from("matieres").select("id, code"),
    supabase.from("evaluations").select("etudiant_id, matiere_id, note, type"),
  ]);

  if (eErr) throw eErr;
  if (mErr) throw mErr;
  if (vErr) throw vErr;

  const codeById = new Map<string, string>();
  (matieres ?? []).forEach((m: any) => codeById.set(m.id, m.code));

  // Pour chaque étudiant : map code -> note (on prend examen/rattrapage en priorité)
  const evalByStudent = new Map<string, Map<string, { note: number; type: string }>>();
  (evaluations ?? []).forEach((ev: any) => {
    const code = codeById.get(ev.matiere_id);
    if (!code) return;
    if (!evalByStudent.has(ev.etudiant_id))
      evalByStudent.set(ev.etudiant_id, new Map());
    const m = evalByStudent.get(ev.etudiant_id)!;
    const existing = m.get(code);
    // Priorité : rattrapage > examen > cc
    const priority = (t: string) =>
      t === "rattrapage" ? 3 : t === "examen" ? 2 : 1;
    if (!existing || priority(ev.type) >= priority(existing.type)) {
      m.set(code, { note: Number(ev.note), type: ev.type });
    }
  });

  const s5Codes = new Set(S5_SUBJECTS.map((s) => s.key));
  const s6Codes = new Set(S6_SUBJECTS.map((s) => s.key));

  const students: Student[] = (etudiants ?? []).map((e: any) => {
    const s5: any = buildEmptyS5();
    const s6: any = buildEmptyS6();
    const notes = evalByStudent.get(e.id);
    if (notes) {
      notes.forEach(({ note }, code) => {
        if (s5Codes.has(code)) s5[code] = note;
        else if (s6Codes.has(code)) s6[code] = note;
      });
    }
    s5.moyenne = computeMoy(s5, S5_SUBJECTS as any);
    s6.moyenne = computeMoy(s6, S6_SUBJECTS as any);
    const moyenneGenerale = +((s5.moyenne + s6.moyenne) / 2).toFixed(2);
    return {
      matricule: e.matricule,
      nom: e.nom,
      prenom: e.prenom,
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
