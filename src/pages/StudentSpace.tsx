import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { STUDENTS, getMention, getDecision, getCreditsS5, getCreditsS6, S5_SUBJECTS, S6_SUBJECTS } from "@/data/students";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BulletinModal } from "@/components/BulletinModal";
import { Grade } from "@/components/Grade";
import { LogOut, FileText, GraduationCap, BookOpen } from "lucide-react";
import logo from "@/assets/logo-inptic.jpg";
import { cn } from "@/lib/utils";

type View = "s5" | "s6" | "annuel";

const StudentSpace = () => {
  const { user, logout } = useAuth();
  const [view, setView] = useState<View>("annuel");
  const [open, setOpen] = useState(false);

  const student = useMemo(
    () => STUDENTS.find((s) => s.matricule === user?.matricule),
    [user]
  );

  // Rang (hook appelé inconditionnellement)
  const rank = useMemo(() => {
    if (!student) return 0;
    const sorted = [...STUDENTS].sort((a, b) => {
      if (view === "s5") return b.s5.moyenne - a.s5.moyenne;
      if (view === "s6") return b.s6.moyenne - a.s6.moyenne;
      return b.moyenneGenerale - a.moyenneGenerale;
    });
    return sorted.findIndex((s) => s.matricule === student.matricule) + 1;
  }, [student, view]);

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <Card className="p-6 max-w-md">
          <p className="text-destructive font-semibold">Étudiant introuvable.</p>
          <Button onClick={logout} variant="outline" className="mt-4">
            <LogOut className="h-4 w-4 mr-1.5" /> Se déconnecter
          </Button>
        </Card>
      </div>
    );
  }

  const credS5 = getCreditsS5(student);
  const credS6 = getCreditsS6(student);
  const totalCred = credS5 + credS6;
  const decision = getDecision(student.moyenneGenerale, student.s5.moyenne, student.s6.moyenne, student);
  const mention = getMention(student.moyenneGenerale);
  const subjects = view === "s5" ? S5_SUBJECTS : view === "s6" ? S6_SUBJECTS : null;
  const grades = view === "s5" ? student.s5 : view === "s6" ? student.s6 : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header personnalisé étudiant */}
      <header className="bg-gradient-header text-primary-foreground shadow-elegant">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <div className="bg-white rounded-full p-1.5 shadow-card-soft shrink-0">
            <img src={logo} alt="INPTIC" className="h-12 w-12 rounded-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-serif text-lg md:text-xl font-bold leading-tight">
              Espace étudiant — {student.prenom} {student.nom}
            </h1>
            <p className="text-xs opacity-90 font-mono">{student.matricule} · LP ASUR 2025/2026</p>
          </div>
          <Button onClick={logout} variant="secondary" size="sm">
            <LogOut className="h-4 w-4 mr-1.5" /> Déconnexion
          </Button>
        </div>
        <div className="h-1 bg-gradient-to-r from-success via-warning to-primary-light" />
      </header>

      <main className="container mx-auto px-4 py-6 space-y-5 animate-fade-in">
        {/* Synthèse */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Moyenne S5</p>
            <p className={cn("text-2xl font-bold tabular-nums", student.s5.moyenne >= 10 ? "text-success" : "text-destructive")}>
              {student.s5.moyenne.toFixed(2)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Moyenne S6</p>
            <p className={cn("text-2xl font-bold tabular-nums", student.s6.moyenne >= 10 ? "text-success" : "text-destructive")}>
              {student.s6.moyenne.toFixed(2)}
            </p>
          </Card>
          <Card className="p-4 bg-primary/5 border-primary/30">
            <p className="text-xs text-muted-foreground">Moyenne générale</p>
            <p className={cn("text-2xl font-bold tabular-nums", student.moyenneGenerale >= 10 ? "text-success" : "text-destructive")}>
              {student.moyenneGenerale.toFixed(2)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{mention}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Crédits ECTS</p>
            <p className="text-2xl font-bold text-primary tabular-nums">{totalCred} / 60</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">S5: {credS5} · S6: {credS6}</p>
          </Card>
        </div>

        {/* Décision du jury */}
        <Card className="p-4 border-l-4 border-l-primary">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-6 w-6 text-primary shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground uppercase">Décision du Conseil d'Établissement</p>
              <p className={cn(
                "text-lg font-bold",
                decision.type === "admis" && "text-success",
                decision.type === "compensation" && "text-warning",
                decision.type === "reprise" && "text-warning",
                decision.type === "refuse" && "text-destructive",
              )}>
                {decision.label}
              </p>
            </div>
          </div>
        </Card>

        {/* Sélecteur + bulletin */}
        <Card className="p-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <Tabs value={view} onValueChange={(v) => setView(v as View)}>
              <TabsList className="h-11 bg-muted">
                <TabsTrigger value="s5" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold px-5">
                  Semestre 5
                </TabsTrigger>
                <TabsTrigger value="s6" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold px-5">
                  Semestre 6
                </TabsTrigger>
                <TabsTrigger value="annuel" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold px-5">
                  Bilan Annuel
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button onClick={() => setOpen(true)} className="bg-primary hover:bg-primary-dark">
              <FileText className="h-4 w-4 mr-1.5" /> Voir mon bulletin
            </Button>
          </div>
        </Card>

        {/* Notes détaillées (S5/S6) ou bilan (annuel) */}
        {subjects && grades ? (
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 font-semibold">
              <BookOpen className="h-4 w-4" />
              Notes du {view === "s5" ? "Semestre 5" : "Semestre 6"} · Rang {rank}/{STUDENTS.length}
            </div>
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold">UE</th>
                  <th className="text-left px-4 py-2 font-semibold">Matière</th>
                  <th className="text-center px-3 py-2 font-semibold">Crédits</th>
                  <th className="text-center px-3 py-2 font-semibold">Coef.</th>
                  <th className="text-center px-3 py-2 font-semibold">Note</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((s, i) => (
                  <tr key={s.key} className={i % 2 === 0 ? "bg-card" : "bg-muted/30"}>
                    <td className="px-4 py-2 text-xs font-mono text-primary">{s.ue}</td>
                    <td className="px-4 py-2">{s.label}</td>
                    <td className="text-center px-3 py-2">{s.credits}</td>
                    <td className="text-center px-3 py-2">{s.coef.toFixed(2).replace(".", ",")}</td>
                    <td className="text-center px-3 py-2">
                      <Grade value={(grades as any)[s.key]} />
                    </td>
                  </tr>
                ))}
                <tr className="bg-primary/10 font-bold">
                  <td colSpan={4} className="px-4 py-2.5 text-right">Moyenne Semestre</td>
                  <td className="text-center px-3 py-2.5">
                    <Grade value={grades.moyenne} />
                  </td>
                </tr>
              </tbody>
            </table>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 font-semibold">
              <BookOpen className="h-4 w-4" />
              Bilan annuel · Rang {rank}/{STUDENTS.length}
            </div>
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold">Période</th>
                  <th className="text-center px-3 py-2 font-semibold">Moyenne</th>
                  <th className="text-center px-3 py-2 font-semibold">Crédits ECTS</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-card">
                  <td className="px-4 py-2.5 font-semibold">Semestre 5</td>
                  <td className="text-center"><Grade value={student.s5.moyenne} /></td>
                  <td className="text-center px-3 py-2.5 font-semibold">{credS5} / 30</td>
                </tr>
                <tr className="bg-muted/30">
                  <td className="px-4 py-2.5 font-semibold">Semestre 6</td>
                  <td className="text-center"><Grade value={student.s6.moyenne} /></td>
                  <td className="text-center px-3 py-2.5 font-semibold">{credS6} / 30</td>
                </tr>
                <tr className="bg-primary/10 font-bold">
                  <td className="px-4 py-2.5">Moyenne annuelle</td>
                  <td className="text-center"><Grade value={student.moyenneGenerale} /></td>
                  <td className="text-center px-3 py-2.5">{totalCred} / 60</td>
                </tr>
              </tbody>
            </table>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground pt-2">
          INPTIC · Espace étudiant en lecture seule · Pour toute correction, contactez la Direction des Études.
        </p>
      </main>

      <BulletinModal student={student} view={view} open={open} onOpenChange={setOpen} />
    </div>
  );
};

export default StudentSpace;
