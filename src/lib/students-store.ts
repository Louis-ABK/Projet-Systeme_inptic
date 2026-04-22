/**
 * Persistance locale de la liste des étudiants importée depuis Excel.
 * Permet au tableau de bord de retrouver automatiquement les données
 * après un rechargement de la page.
 */
import { Student, STUDENTS as DEFAULT_STUDENTS } from "@/data/students";

const KEY = "inptic_students_v1";

export const loadStudents = (): Student[] | null => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as Student[];
    return null;
  } catch {
    return null;
  }
};

export const saveStudents = (students: Student[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(students));
  } catch {
    // ignore quota
  }
};

export const clearStudents = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
};

export const getInitialStudents = (): Student[] => loadStudents() ?? DEFAULT_STUDENTS;
