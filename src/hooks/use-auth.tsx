import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { AuthUser } from "@/lib/auth-store";

type Ctx = {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ user: AuthUser | null; error: string | null }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<Ctx | null>(null);

const buildAuthUser = async (session: Session | null): Promise<AuthUser | null> => {
  if (!session?.user) return null;
  const userId = session.user.id;
  const email = session.user.email ?? "";

  // Récupère rôle
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  const isAdmin = (roles ?? []).some(
    (r) => r.role === "admin" || r.role === "secretariat"
  );

  if (isAdmin) {
    return {
      email,
      role: "admin",
      displayName: "Administration INPTIC",
      userId,
    };
  }

  // Étudiant : lit profil + etudiant
  const { data: profile } = await supabase
    .from("profiles")
    .select("nom, prenom, matricule")
    .eq("user_id", userId)
    .maybeSingle();
  const { data: etu } = await supabase
    .from("etudiants")
    .select("matricule, nom, prenom")
    .eq("user_id", userId)
    .maybeSingle();

  const nom = etu?.nom || profile?.nom || "";
  const prenom = etu?.prenom || profile?.prenom || "";
  const matricule = etu?.matricule || profile?.matricule || undefined;

  return {
    email,
    role: "student",
    matricule,
    displayName: `${prenom} ${nom}`.trim() || email,
    userId,
  };
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listener AVANT getSession (recommandé)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      // Defer la lecture des tables pour éviter deadlock
      setTimeout(async () => {
        const u = await buildAuthUser(sess);
        setUser(u);
        setLoading(false);
      }, 0);
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      buildAuthUser(sess).then((u) => {
        setUser(u);
        setLoading(false);
      });
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error || !data.session) {
      return { user: null, error: error?.message || "Identifiants invalides" };
    }
    const u = await buildAuthUser(data.session);
    setUser(u);
    setSession(data.session);
    return { user: u, error: null };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ user, session, loading, login, logout }),
    [user, session, loading, login, logout]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
