import { supabase } from "@/integrations/supabase/client";
import { Student } from "@/data/students";
import { ClasseKey, getSubjects, buildEmptyGrades, FILIERES_MAP } from "@/data/referentiel";

const computeMoy = (
  grades: Record<string, number>,
  subjects: readonly { key: string; coef: number }[]
): number => {
  let sum = 0, coef = 0;
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
  // Règle : 40% CC + 60% Examen. Si pas de CC → Examen compte pour 100%
  if (hasCC && hasEx) base = e.cc! * 0.4 + e.examen! * 0.6;
  else if (hasEx) base = e.examen!;  // examen seul = 100%
  else if (hasCC) base = e.cc!;      // cc seul = 100%

  // Règle rattrapage : la note obtenue remplace la moyenne initiale si elle est supérieure
  if (hasRat && base !== null) return Math.max(base, e.rattrapage!);
  if (hasRat) return e.rattrapage!;
  return base ?? 0;
};

export const fetchStudents = async (classeKey?: ClasseKey | null): Promise<Student[]> => {
  let etudiantsQuery = supabase
    .from("etudiants")
    .select(`
      id, matricule, nom, prenom, date_naissance, lieu_naissance, sexe, etablissement,
      classes(code, niveau, filieres(code))
    `)
    .order("matricule");

  if (classeKey) {
    etudiantsQuery = etudiantsQuery.eq("classes.code", classeKey);
  }

  const [
    { data: etudiants, error: eErr },
    { data: matieres, error: mErr },
    { data: evaluations, error: vErr },
    { data: absences },
  ] = await Promise.all([
    etudiantsQuery,
    supabase.from("matieres").select("id, code"),
    supabase.from("evaluations").select("etudiant_id, matiere_id, note, type"),
    supabase.from("absences").select("etudiant_id, matiere_id, heures"),
  ]);

  if (eErr) throw eErr;
  if (mErr) throw mErr;
  if (vErr) throw vErr;
  // On ne bloque pas si absences échoue (table peut ne pas exister encore)

  const codeById = new Map<string, string>();
  (matieres ?? []).forEach((m: any) => codeById.set(m.id, m.code));

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

  // Index des absences par étudiant et code matière
  const absenceByStudent = new Map<string, Map<string, number>>();
  (absences ?? []).forEach((ab: any) => {
    const code = codeById.get(ab.matiere_id);
    if (!code) return;
    if (!absenceByStudent.has(ab.etudiant_id))
      absenceByStudent.set(ab.etudiant_id, new Map());
    absenceByStudent.get(ab.etudiant_id)!.set(code, Number(ab.heures));
  });

  const students: Student[] = (etudiants ?? [])
    // Si classeKey est fourni mais la condition eq de Supabase n'a pas tout filtré correctement (parfois le left join ramène quand même l'étudiant avec classe null)
    .filter((e: any) => !classeKey || e.classes?.code === classeKey)
    .map((e: any) => {
      const eClasseKey = e.classes?.code;
      const s5Subjects = getSubjects(eClasseKey, 's5');
      const s6Subjects = getSubjects(eClasseKey, 's6');
      
      const s5Codes = new Set(s5Subjects.map((s) => s.key));
      const s6Codes = new Set(s6Subjects.map((s) => s.key));

      const s5 = buildEmptyGrades(eClasseKey, 's5');
      const s6 = buildEmptyGrades(eClasseKey, 's6');

      const notes = evalByStudent.get(e.id);
      const etudiantAbsences = absenceByStudent.get(e.id);

      if (notes) {
        notes.forEach((entry, code) => {
          let finale = finalNoteForSubject(entry);
          // Règle absence : pénalité 0,01 point/heure, plancher 0/20
          const heures = etudiantAbsences?.get(code) ?? 0;
          if (heures > 0) {
            finale = Math.max(0, finale - heures * 0.01);
          }
          if (s5Codes.has(code)) s5[code] = finale;
          else if (s6Codes.has(code)) s6[code] = finale;
        });
      }

      s5.moyenne = computeMoy(s5, s5Subjects);
      s6.moyenne = computeMoy(s6, s6Subjects);

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
        sexe: e.sexe,
        etablissement: e.etablissement,
        classeKey: eClasseKey,
        niveau: e.classes?.niveau,
        filiere: e.classes?.filieres?.code,
        departement: e.classes?.filieres?.code ? FILIERES_MAP[e.classes.filieres.code]?.dept : undefined,
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
