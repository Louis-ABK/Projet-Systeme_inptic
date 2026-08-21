import logo from "@/assets/logo-inptic.jpg";
import { Button } from "@/components/ui/button";
import { LogOut, Settings } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { ClasseSelector } from "@/components/ClasseSelector";
import { useClasse } from "@/contexts/ClasseContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const AppHeader = ({ hideClasseSelector }: { hideClasseSelector?: boolean }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { departement, filiere, niveau } = useClasse();

  const { data: departements } = useQuery({
    queryKey: ["departements"],
    queryFn: async () => {
      const { data } = await supabase.from("departements").select("*");
      return data || [];
    },
  });

  const { data: filieres } = useQuery({
    queryKey: ["filieres"],
    queryFn: async () => {
      const { data } = await supabase.from("filieres").select("*");
      return data || [];
    },
  });

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const deptLibelle = departement ? departements?.find(d => d.code === departement)?.libelle : null;
  const filiereLibelle = filiere ? filieres?.find(f => f.code === filiere)?.libelle : null;

  return (
    <header className="bg-gradient-header text-primary-foreground shadow-elegant">
      <div className="container mx-auto px-4 py-4 flex items-center gap-4">
        <div className="bg-white rounded-full p-1.5 shadow-card-soft shrink-0">
          <img src={logo} alt="Logo INPTIC" className="h-14 w-14 rounded-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-serif text-2xl md:text-3xl font-bold leading-tight">
            INPTIC Grade Manager
          </h1>
          <p className="text-sm opacity-90">
            Direction des Études et de la Pédagogie{" "}
            {deptLibelle && (
              <span>· <span className="font-semibold">{deptLibelle}</span></span>
            )}
            {filiereLibelle && niveau && (
              <span> › <span className="font-semibold">{filiereLibelle} — {niveau}</span></span>
            )}
          </p>
        </div>
        <div className="hidden md:block text-right">
          <p className="text-xs opacity-80">Année universitaire</p>
          <p className="text-xl font-bold font-serif">2025 / 2026</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {user?.role === "admin" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate("/admin/referentiel")}
              className="ml-2"
            >
              <Settings className="h-4 w-4 mr-1.5" /> Référentiel
            </Button>
          )}
          {user && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-1.5" /> Déconnexion
            </Button>
          )}
        </div>
      </div>
      {/* Barre de sélection de classe */}
      {!hideClasseSelector && (
        <div className="container mx-auto px-4 pb-3">
          <div className="bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm">
            <p className="text-xs opacity-75 mb-1.5">Sélectionner une classe :</p>
            <ClasseSelector />
          </div>
        </div>
      )}
      <div className="h-1 bg-gradient-to-r from-success via-warning to-primary-light" />
    </header>
  );
};
