/**
 * Système d'authentification local (localStorage).
 * - Admin : admin@inptic.ga / admin2026
 * - Étudiants : {prenom}.{nom}@inptic.ga / {matricule}
 *   (mot de passe par défaut = matricule, modifiable)
 */
import { STUDENTS, Student } from "@/data/students";

export type Role = "admin" | "student";

export type AuthUser = {
  email: string;
  role: Role;
  matricule?: string;
  displayName: string;
};

const SESSION_KEY = "inptic_session_v1";
const PWD_KEY = "inptic_credentials_v1";

const ADMIN_EMAIL = "admin@inptic.ga";
const ADMIN_DEFAULT_PWD = "admin2026";

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");

export const studentEmail = (s: Pick<Student, "nom" | "prenom">) =>
  `${slug(s.prenom)}.${slug(s.nom)}@inptic.ga`;

const readPwd = (): Record<string, string> => {
  try {
    return JSON.parse(localStorage.getItem(PWD_KEY) || "{}");
  } catch {
    return {};
  }
};

const writePwd = (data: Record<string, string>) => {
  localStorage.setItem(PWD_KEY, JSON.stringify(data));
};

export const findStudentByEmail = (email: string): Student | undefined => {
  const e = email.trim().toLowerCase();
  return STUDENTS.find((s) => studentEmail(s) === e);
};

export const login = (email: string, password: string): AuthUser | null => {
  const e = email.trim().toLowerCase();
  const pwd = password.trim();
  const creds = readPwd();

  // ADMIN
  if (e === ADMIN_EMAIL) {
    const expected = creds[ADMIN_EMAIL] || ADMIN_DEFAULT_PWD;
    if (pwd !== expected) return null;
    const user: AuthUser = {
      email: ADMIN_EMAIL,
      role: "admin",
      displayName: "Administration INPTIC",
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  }

  // STUDENT
  const student = findStudentByEmail(e);
  if (!student) return null;
  const expected = creds[e] || student.matricule;
  if (pwd !== expected) return null;
  const user: AuthUser = {
    email: e,
    role: "student",
    matricule: student.matricule,
    displayName: `${student.prenom} ${student.nom}`,
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
};

export const logout = () => {
  sessionStorage.removeItem(SESSION_KEY);
};

export const getCurrentUser = (): AuthUser | null => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
};

export const changePassword = (email: string, newPwd: string) => {
  const creds = readPwd();
  creds[email.trim().toLowerCase()] = newPwd;
  writePwd(creds);
};

export const ADMIN_INFO = {
  email: ADMIN_EMAIL,
  defaultPassword: ADMIN_DEFAULT_PWD,
};
