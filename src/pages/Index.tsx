import { useMemo, useState, useRef } from "react";
import { AppHeader } from "@/components/AppHeader";
import { GradesTable } from "@/components/GradesTable";
import { BulletinModal } from "@/components/BulletinModal";
import { GradeEntry } from "@/components/GradeEntry";
import { Student } from "@/data/students";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, ClipboardList, Table2, Upload, RotateCcw, Loader2 } from "lucide-react";
import { importStudentsFromExcel } from "@/lib/excel-import";
import { useStudents } from "@/hooks/use-students";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type View = "s5" | "s6" | "annuel";
type Mode = "consult" | "entry";

const Index = () => {
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("consult");
  const [view, setView] = useState<View>("annuel");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Student | null>(null);
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { students, loading, reload } = useStudents();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.nom.toLowerCase().includes(q) ||
        s.prenom.toLowerCase().includes(q) ||
        s.matricule.toLowerCase().includes(q)
    );
  }, [search, students]);

  const stats = useMemo(() => {
    const total = students.length;
    if (!total) return { total: 0, admis: 0, compensation: 0, refuses: 0, moy: 0 };
    const admis = students.filter(
      (s) => s.moyenneGenerale >= 10 && s.s5.moyenne >= 10 && s.s6.moyenne >= 10
    ).length;
    const compensation = students.filter(
      (s) => s.moyenneGenerale >= 10 && (s.s5.moyenne < 10 || s.s6.moyenne < 10)
    ).length;
    const refuses = students.filter((s) => s.moyenneGenerale < 10).length;
    const moy = students.reduce((a, s) => a + s.moyenneGenerale, 0) / total;
    return { total, admis, compensation, refuses, moy };
  }, [students]);

  const showBulletin = (s: Student) => {
    setSelected(s);
    setOpen(true);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    setImporting(true);
    try {
      toast({
        title: `Lecture des fichiers… (${files.length})`,
        description: files.map((f) => f.name).join(", "),
      });
      const { students: parsed, warnings, info } = await importStudentsFromExcel(files);
      if (parsed.length === 0) {
        toast({
          title: "Aucune donnée détectée",
          description: warnings[0] || "Vérifiez vos fichiers.",
          variant: "destructive",
        });
        return;
      }

      // Conversion : s5/s6 → { code: note } (on garde toute valeur numérique présente)
      const payload = {
        students: parsed.map((s) => ({
          matricule: s.matricule,
          nom: s.nom,
          prenom: s.prenom,
          dateNaissance: s.dateNaissance ?? undefined,
          lieuNaissance: s.lieuNaissance ?? undefined,
          bac: s.bac ?? undefined,
          etablissement: s.etablissement ?? undefined,
          s5: Object.fromEntries(
            Object.entries(s.s5).filter(
              ([k, v]) => k !== "moyenne" && typeof v === "number" && !isNaN(v) && v > 0
            )
          ),
          s6: Object.fromEntries(
            Object.entries(s.s6).filter(
              ([k, v]) => k !== "moyenne" && typeof v === "number" && !isNaN(v) && v > 0
            )
          ),
        })),
      };

      toast({
        title: "Envoi vers le serveur…",
        description: `${parsed.length} étudiant(s) à enregistrer.`,
      });

      const { data, error } = await supabase.functions.invoke("import-students", {
        body: payload,
      });

      if (error) throw new Error(error.message);

      await reload();

      toast({
        title: `Import réussi : ${parsed.length} étudiant(s)`,
        description: [
          data?.createdAccounts ? `${data.createdAccounts} compte(s) créé(s)` : null,
          data?.createdStudents ? `${data.createdStudents} nouveau(x)` : null,
          data?.createdEvaluations ? `${data.createdEvaluations} note(s) enregistrée(s)` : null,
          data?.totalErrors ? `${data.totalErrors} erreur(s)` : null,
        ].filter(Boolean).join(" · ") || "Tableau de bord mis à jour.",
      });
      if (info.length) console.log("[Import]", info);
      if (warnings.length) console.warn("[Import] Avertissements :", warnings);
      if (data?.errors?.length) console.warn("[Import] Erreurs serveur :", data.errors);
    } catch (err: any) {
      toast({
        title: "Erreur d'import",
        description: err?.message || "Fichier illisible.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container mx-auto px-4 py-6 space-y-5 animate-fade-in">
        {/* Sélecteur de mode */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
            <TabsList className="h-11 bg-muted">
              <TabsTrigger
                value="consult"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold px-5"
              >
                <Table2 className="h-4 w-4 mr-1.5" /> Tableau de bord
              </TabsTrigger>
              <TabsTrigger
                value="entry"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold px-5"
              >
                <ClipboardList className="h-4 w-4 mr-1.5" /> Saisie des notes
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {mode === "consult" && (
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                multiple
                className="hidden"
                onChange={handleImport}
                disabled={importing}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                title="Sélectionnez un ou plusieurs fichiers Excel (S5 et/ou S6)"
              >
                {importing ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-1.5" />
                )}
                Importer Excel (S5 + S6)
              </Button>
              <Button variant="ghost" onClick={() => reload()} disabled={loading || importing}>
                <RotateCcw className="h-4 w-4 mr-1.5" /> Actualiser
              </Button>
            </div>
          )}
        </div>

        {mode === "entry" ? (
          <GradeEntry onSaved={reload} />
        ) : (
          <>
            <Card className="p-4 shadow-card-soft border-border/60 bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Effectif total :</span>{" "}
                  <strong className="text-primary">{stats.total} étudiants</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Moyenne promotion :</span>{" "}
                  <strong className="text-primary tabular-nums">
                    {stats.moy.toFixed(2)}/20
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Admis directs :</span>{" "}
                  <strong className="text-success">{stats.admis}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Par compensation :</span>{" "}
                  <strong className="text-warning">{stats.compensation}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Ajournés :</span>{" "}
                  <strong className="text-destructive">{stats.refuses}</strong>
                </div>
              </div>
            </Card>

            <Card className="p-4 shadow-card-soft border-border/60">
              <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
                <Tabs value={view} onValueChange={(v) => setView(v as View)} className="w-full lg:w-auto">
                  <TabsList className="grid grid-cols-3 lg:w-[440px] h-11 bg-muted">
                    <TabsTrigger
                      value="s5"
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold"
                    >
                      Semestre 5
                    </TabsTrigger>
                    <TabsTrigger
                      value="s6"
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold"
                    >
                      Semestre 6
                    </TabsTrigger>
                    <TabsTrigger
                      value="annuel"
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold"
                    >
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
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-sm bg-destructive/15 border border-destructive/40" />{" "}
                  Note &lt; 10 (en rouge)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-sm bg-success/15 border border-success/40" />{" "}
                  Excellence ≥ 14
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-sm bg-warning/15 border border-warning/40" />{" "}
                  Compensation S5/S6
                </span>
                <span>
                  Règle : <strong>Admis</strong> si Moyenne Générale ≥ 10/20
                </span>
              </div>
            </Card>

            {loading ? (
              <Card className="p-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Chargement des données…</p>
              </Card>
            ) : students.length === 0 ? (
              <Card className="p-12 text-center">
                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-1">Aucun étudiant enregistré</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Importez un fichier Excel S5 et/ou S6 pour commencer.
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-primary hover:bg-primary-dark"
                >
                  <Upload className="h-4 w-4 mr-1.5" /> Importer un fichier Excel
                </Button>
              </Card>
            ) : (
              <GradesTable students={filtered} view={view} onShowBulletin={showBulletin} />
            )}
          </>
        )}

        <p className="text-center text-xs text-muted-foreground pt-2">
          INPTIC · Licence Professionnelle Réseaux et Télécommunications · Option ASUR · Promotion 2025/2026
        </p>
      </main>

      <BulletinModal student={selected} view={view} open={open} onOpenChange={setOpen} students={students} />
    </div>
  );
};

export default Index;
