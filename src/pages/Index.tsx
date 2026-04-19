import { useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { GradesTable } from "@/components/GradesTable";
import { BulletinModal } from "@/components/BulletinModal";
import { GradeEntry } from "@/components/GradeEntry";
import { STUDENTS, Student } from "@/data/students";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, ClipboardList, Table2 } from "lucide-react";

type View = "s5" | "s6" | "annuel";
type Mode = "consult" | "entry";

const Index = () => {
  const [mode, setMode] = useState<Mode>("consult");
  const [view, setView] = useState<View>("annuel");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Student | null>(null);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return STUDENTS;
    return STUDENTS.filter(
      (s) =>
        s.nom.toLowerCase().includes(q) ||
        s.prenom.toLowerCase().includes(q) ||
        s.matricule.toLowerCase().includes(q)
    );
  }, [search]);

  const stats = useMemo(() => {
    const total = STUDENTS.length;
    const admis = STUDENTS.filter(s => s.moyenneGenerale >= 10 && s.s5.moyenne >= 10 && s.s6.moyenne >= 10).length;
    const compensation = STUDENTS.filter(s => s.moyenneGenerale >= 10 && (s.s5.moyenne < 10 || s.s6.moyenne < 10)).length;
    const refuses = STUDENTS.filter(s => s.moyenneGenerale < 10).length;
    const moy = STUDENTS.reduce((a, s) => a + s.moyenneGenerale, 0) / total;
    return { total, admis, compensation, refuses, moy };
  }, []);

  const showBulletin = (s: Student) => {
    setSelected(s);
    setOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container mx-auto px-4 py-6 space-y-5 animate-fade-in">
        {/* Synthèse compacte (texte uniquement, sans diagrammes) */}
        <Card className="p-4 shadow-card-soft border-border/60 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
            <div><span className="text-muted-foreground">Effectif total :</span> <strong className="text-primary">{stats.total} étudiants</strong></div>
            <div><span className="text-muted-foreground">Moyenne promotion :</span> <strong className="text-primary tabular-nums">{stats.moy.toFixed(2)}/20</strong></div>
            <div><span className="text-muted-foreground">Admis directs :</span> <strong className="text-success">{stats.admis}</strong></div>
            <div><span className="text-muted-foreground">Par compensation :</span> <strong className="text-warning">{stats.compensation}</strong></div>
            <div><span className="text-muted-foreground">Ajournés :</span> <strong className="text-destructive">{stats.refuses}</strong></div>
          </div>
        </Card>

        {/* Controls */}
        <Card className="p-4 shadow-card-soft border-border/60">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            <Tabs value={view} onValueChange={(v) => setView(v as View)} className="w-full lg:w-auto">
              <TabsList className="grid grid-cols-3 lg:w-[440px] h-11 bg-muted">
                <TabsTrigger value="s5" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold">
                  Semestre 5
                </TabsTrigger>
                <TabsTrigger value="s6" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold">
                  Semestre 6
                </TabsTrigger>
                <TabsTrigger value="annuel" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold">
                  Bilan Annuel
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative w-full lg:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher (nom, matricule…)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-11"
              />
            </div>
          </div>

          <div className="mt-3 text-xs text-muted-foreground flex flex-wrap gap-x-5 gap-y-1">
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-destructive/15 border border-destructive/40" /> Note &lt; 10 (en rouge)</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-success/15 border border-success/40" /> Excellence ≥ 14</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-warning/15 border border-warning/40" /> Compensation S5/S6</span>
            <span>Règle : <strong>Admis</strong> si Moyenne Générale ≥ 10/20</span>
          </div>
        </Card>

        {/* Table */}
        <GradesTable students={filtered} view={view} onShowBulletin={showBulletin} />

        <p className="text-center text-xs text-muted-foreground pt-2">
          INPTIC · Licence Professionnelle Réseaux et Télécommunications · Option ASUR · Promotion 2025/2026
        </p>
      </main>

      <BulletinModal student={selected} view={view} open={open} onOpenChange={setOpen} />
    </div>
  );
};

export default Index;
