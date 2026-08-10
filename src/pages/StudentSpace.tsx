import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getMention, getDecision, getCreditsS5, getCreditsS6, hasEliminatoryInUE, ELIMINATORY_THRESHOLD } from "@/data/students";
import { getSubjects, ClasseKey } from "@/data/referentiel";
import { useStudents } from "@/hooks/use-students";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BulletinModal } from "@/components/BulletinModal";
import { Grade } from "@/components/Grade";
import { LogOut, FileText, GraduationCap, BookOpen, Loader2 } from "lucide-react";
import logo from "@/assets/logo-inptic.jpg";
import { cn } from "@/lib/utils";

type View = "s5" | "s6" | "annuel";

const StudentSpace = () => {
  const { user, logout } = useAuth();
  const [view, setView] = useState<View>("annuel");
  const [open, setOpen] = useState(false);
  const { students, loading } = useStudents();

  const student = useMemo(
    () => students.find((s) => s.matricule === user?.matricule),
    [user, students]
  );

  const rank = useMemo(() => {
    if (!student) return 0;
    const sorted = [...students].sort((a, b) => {
      if (view === "s5") return (b.s5.moyenne || 0) - (a.s5.moyenne || 0);
      if (view === "s6") return (b.s6.moyenne || 0) - (a.s6.moyenne || 0);
      return (b.moyenneGenerale || 0) - (a.moyenneGenerale || 0);
    });
    return sorted.findIndex((s) => s.matricule === student.matricule) + 1;
  }, [student, view, students]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <Card className="p-6 max-w-md">
          <p className="text-destructive font-semibold">Étudiant introuvable.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Vos données ne sont pas encore enregistrées. Contactez l'administration.
          </p>
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
  const decision = getDecision(student.moyenneGenerale, student.s5.moyenne || 0, student.s6.moyenne || 0, student);
  const mention = getMention(student.moyenneGenerale);
  const subjects = view === "s5" ? getSubjects(student.classeKey as ClasseKey, "s5") : view === "s6" ? getSubjects(student.classeKey as ClasseKey, "s6") : null;
  const grades = view === "s5" ? student.s5 : view === "s6" ? student.s6 : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-header text-primary-foreground shadow-elegant">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <div className="bg-white rounded-full p-1.5 shadow-card-soft shrink-0">
            <img src={logo} alt="INPTIC" className="h-12 w-12 rounded-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-serif text-lg md:text-xl font-bold leading-tight">
              Espace étudiant — {student.prenom} {student.nom}
            </h1>
            <p className="text-xs opacity-90 font-mono">{student.matricule} · {student.classeKey || "INPTIC"} 2025/2026</p>
          </div>
          <Button onClick={logout} variant="secondary" size="sm">
            <LogOut className="h-4 w-4 mr-1.5" /> Déconnexion
          </Button>
        </div>
        <div className="h-1 bg-gradient-to-r from-success via-warning to-primary-light" />
      </header>

      <main className="container mx-auto px-4 py-6 space-y-5 animate-fade-in">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Moyenne S5</p>
            <p className={cn("text-2xl font-bold tabular-nums", (student.s5.moyenne || 0) >= 10 ? "text-success" : "text-destructive")}>
              {(student.s5.moyenne || 0).toFixed(2)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Moyenne S6</p>
            <p className={cn("text-2xl font-bold tabular-nums", (student.s6.moyenne || 0) >= 10 ? "text-success" : "text-destructive")}>
              {(student.s6.moyenne || 0).toFixed(2)}
            </p>
          </Card>
          <Card className="p-4 bg-primary/5 border-primary/30">
            <p className="text-xs text-muted-foreground">Moyenne générale</p>
            <p className={cn("text-2xl font-bold tabular-nums", (student.moyenneGenerale || 0) >= 10 ? "text-success" : "text-destructive")}>
              {(student.moyenneGenerale || 0).toFixed(2)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{mention}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Crédits ECTS</p>
            <p className="text-2xl font-bold text-primary tabular-nums">{totalCred} / 60</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">S5: {credS5} · S6: {credS6}</p>
          </Card>
        </div>

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

        {subjects && grades ? (
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 font-semibold">
              <BookOpen className="h-4 w-4" />
              Notes du {view === "s5" ? "Semestre 5" : "Semestre 6"} · Rang {rank}/{students.length}
            </div>
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold">UE / Matière</th>
                  <th className="text-center px-3 py-2 font-semibold">Crédits</th>
                  <th className="text-center px-3 py-2 font-semibold">Coef.</th>
                  <th className="text-center px-3 py-2 font-semibold">Note</th>
                  <th className="text-center px-3 py-2 font-semibold">Validation</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(new Set(subjects.map((s) => s.ue))).map((ue) => {
                  const ueSubjects = subjects.filter((s) => s.ue === ue);
                  const totalCoef = ueSubjects.reduce((a, b) => a + b.coef, 0);
                  const sum = ueSubjects.reduce(
                    (a, b) => a + (((grades as any)[b.key] as number) || 0) * b.coef,
                    0
                  );
                  const moyUE = (() => {
                    let s = 0, c = 0;
                    ueSubjects.forEach(b => {
                      const v = (grades as any)[b.key] as number;
                      if (v >= 0) { s += v * b.coef; c += b.coef; }
                    });
                    return c ? s / c : 0;
                  })();
                  const moyemSem = (grades as any).moyenne || 0;
                  const totalCredUE = ueSubjects.reduce((a, b) => a + b.credits, 0);
                  // Note éliminatoire (<=5) dans l'UE → pas de compensation
                  const hasElimInUE = hasEliminatoryInUE(grades as Record<string, number>, ueSubjects);
                  const ueAcquise = moyUE >= 10;
                  const ueCompensee = !ueAcquise && moyemSem >= 10 && !hasElimInUE;
                  const ueValidee = ueAcquise || ueCompensee;
                  return (
                    <React.Fragment key={ue}>
                      <tr className="bg-primary/10">
                        <td className="px-4 py-2 font-bold text-primary">{ue}</td>
                        <td className="text-center px-3 py-2 font-bold">{totalCredUE}</td>
                        <td className="text-center px-3 py-2 font-bold">{totalCoef.toFixed(2).replace(".", ",")}</td>
                        <td className="text-center px-3 py-2">
                          <span className={cn(
                            "inline-block px-2 py-0.5 rounded font-bold tabular-nums",
                            moyUE >= 10 ? "bg-success/10 text-success" : ueCompensee ? "bg-warning/10 text-warning" : hasElimInUE ? "bg-destructive/20 text-destructive" : "bg-destructive/10 text-destructive"
                          )}>
                            {moyUE.toFixed(2)}
                          </span>
                        </td>
                        <td className="text-center px-3 py-2">
                          <span className={cn(
                            "inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold",
                            ueAcquise ? "bg-success/15 text-success" : ueCompensee ? "bg-warning/15 text-warning" : "bg-destructive/15 text-destructive"
                          )}>
                            {ueAcquise ? "Acquis" : ueCompensee ? "Compensé" : hasElimInUE ? "Non acquis — Élim." : "Non acquis"}
                          </span>
                        </td>
                      </tr>
                      {ueSubjects.map((s, i) => {
                        // Conserver -1 (pas de note saisie) pour ne pas déclencher faussement l'éliminatoire
                        const noteMatiere = (grades as any)[s.key] as number ?? -1;
                        const matiereValidee = noteMatiere >= 10;
                        // Note éliminatoire : saisie (>= 0) ET strictement < 6
                        const matiereEliminatoire = noteMatiere >= 0 && noteMatiere < ELIMINATORY_THRESHOLD;
                        const matiereCompensee = !matiereValidee && !matiereEliminatoire && ueCompensee;
                        return (
                          <tr key={s.key} className={cn(i % 2 === 0 ? "bg-card" : "bg-muted/30", matiereEliminatoire && "bg-destructive/5")}>
                            <td className="px-4 py-2 pl-8 text-muted-foreground">
                              {s.label}
                              {matiereEliminatoire && <span className="ml-2 text-[10px] font-bold text-destructive uppercase tracking-wide">⚠ Élim.</span>}
                            </td>
                            <td className="text-center px-3 py-2">{s.credits}</td>
                            <td className="text-center px-3 py-2">{s.coef.toFixed(2).replace(".", ",")}</td>
                            <td className="text-center px-3 py-2">
                              <Grade value={noteMatiere >= 0 ? noteMatiere : -1} />
                            </td>
                            <td className="text-center px-3 py-2">
                              <span className={cn(
                                "inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold",
                                matiereValidee ? "bg-success/15 text-success" : matiereEliminatoire ? "bg-destructive/20 text-destructive" : matiereCompensee ? "bg-warning/15 text-warning" : "bg-destructive/15 text-destructive"
                              )}>
                                {matiereValidee ? "Validé" : matiereEliminatoire ? "Éliminatoire" : matiereCompensee ? "Compensé" : "Non validé"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
                <tr className="bg-primary/15 font-bold border-t-2 border-primary/30">
                  <td colSpan={3} className="px-4 py-2.5 text-right">Moyenne Semestre</td>
                  <td className="text-center px-3 py-2.5">
                    <Grade value={(grades as any).moyenne || 0} />
                  </td>
                  <td className="text-center px-3 py-2.5">
                    <span className={cn(
                      "inline-block px-2.5 py-1 rounded-full text-xs font-semibold",
                      ((grades as any).moyenne || 0) >= 10 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                    )}>
                      {((grades as any).moyenne || 0) >= 10 ? "Semestre validé" : "Semestre non validé"}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 font-semibold">
              <BookOpen className="h-4 w-4" />
              Bilan annuel · Rang {rank}/{students.length}
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
                  <td className="text-center"><Grade value={student.s5.moyenne || 0} /></td>
                  <td className="text-center px-3 py-2.5 font-semibold">{credS5} / 30</td>
                </tr>
                <tr className="bg-muted/30">
                  <td className="px-4 py-2.5 font-semibold">Semestre 6</td>
                  <td className="text-center"><Grade value={student.s6.moyenne || 0} /></td>
                  <td className="text-center px-3 py-2.5 font-semibold">{credS6} / 30</td>
                </tr>
                <tr className="bg-primary/10 font-bold">
                  <td className="px-4 py-2.5">Moyenne annuelle</td>
                  <td className="text-center"><Grade value={student.moyenneGenerale || 0} /></td>
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

      <BulletinModal student={student} view={view} open={open} onOpenChange={setOpen} students={students} />
    </div>
  );
};

export default StudentSpace;
