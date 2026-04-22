import { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { ADMIN_INFO, studentEmail } from "@/lib/auth-store";
import { STUDENTS } from "@/data/students";
import { GraduationCap, Shield, LogIn, Info } from "lucide-react";
import logo from "@/assets/logo-inptic.jpg";

const Login = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [tab, setTab] = useState<"student" | "admin">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    const dest = user.role === "admin" ? "/admin" : "/etudiant";
    return <Navigate to={dest} replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const u = login(email, password);
    setLoading(false);
    if (!u) {
      toast({
        title: "Connexion refusée",
        description: "Email ou mot de passe invalide.",
        variant: "destructive",
      });
      return;
    }
    if (tab === "admin" && u.role !== "admin") {
      toast({ title: "Accès refusé", description: "Cet espace est réservé à l'administration.", variant: "destructive" });
      return;
    }
    toast({ title: `Bienvenue ${u.displayName}`, description: "Connexion réussie." });
    const from = (location.state as any)?.from?.pathname;
    navigate(from || (u.role === "admin" ? "/admin" : "/etudiant"), { replace: true });
  };

  const exampleStudent = STUDENTS[0];
  const exampleEmail = studentEmail(exampleStudent);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="bg-white rounded-full p-2 shadow-elegant mb-3">
            <img src={logo} alt="INPTIC" className="h-16 w-16 rounded-full object-cover" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-primary">INPTIC Grade Manager</h1>
          <p className="text-sm text-muted-foreground">
            Direction des Études et de la Pédagogie · LP ASUR 2025/2026
          </p>
        </div>

        <Card className="p-6 shadow-modal border-border/60">
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList className="grid grid-cols-2 mb-5 h-11">
              <TabsTrigger
                value="student"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold"
              >
                <GraduationCap className="h-4 w-4 mr-1.5" /> Étudiant
              </TabsTrigger>
              <TabsTrigger
                value="admin"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold"
              >
                <Shield className="h-4 w-4 mr-1.5" /> Administration
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Adresse email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={tab === "admin" ? ADMIN_INFO.email : exampleEmail}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={tab === "admin" ? "•••••••••" : "Votre matricule"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-primary hover:bg-primary-dark font-semibold"
              >
                <LogIn className="h-4 w-4 mr-1.5" />
                Se connecter
              </Button>
            </form>

            <TabsContent value="student" className="mt-5">
              <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Identifiants étudiants</p>
                    <p className="mt-1">
                      Email : <span className="font-mono">prenom.nom@inptic.ga</span>
                      <br />
                      Mot de passe par défaut : <span className="font-mono">votre matricule</span>
                    </p>
                    <p className="mt-2 text-[11px]">
                      Ex : <span className="font-mono">{exampleEmail}</span> /{" "}
                      <span className="font-mono">{exampleStudent.matricule}</span>
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="admin" className="mt-5">
              <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Compte administrateur</p>
                    <p className="mt-1">
                      Email : <span className="font-mono">{ADMIN_INFO.email}</span>
                      <br />
                      Mot de passe : <span className="font-mono">{ADMIN_INFO.defaultPassword}</span>
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-5">
          © INPTIC · République Gabonaise · Direction des Études
        </p>
      </div>
    </div>
  );
};

export default Login;
