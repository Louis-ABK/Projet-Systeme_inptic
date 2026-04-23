/**
 * Auth helpers — utilitaires conservés pour compat (slug, ADMIN_INFO).
 * L'authentification réelle passe par Supabase Auth (cf. src/hooks/use-auth.tsx).
 */

export type Role = "admin" | "student";

export type AuthUser = {
  email: string;
  role: Role;
  matricule?: string;
  displayName: string;
  userId: string;
};

const slug = (s: string) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");

export const studentEmail = (s: { nom: string; prenom: string }) =>
  `${slug(s.prenom)}.${slug(s.nom)}@inptic.ga`;

export const ADMIN_INFO = {
  email: "admin@inptic.ga",
  defaultPassword: "admin2026",
};
