import { useMemo, useState, useRef, useEffect } from "react";
import { AppHeader } from "@/components/AppHeader";
import { GradesTable } from "@/components/GradesTable";
import { BulletinModal } from "@/components/BulletinModal";
import { StudentDialog } from "@/components/StudentDialog";
import { StudentListTable } from "@/components/StudentListTable";
import { cn, handleEdgeError } from "@/lib/utils";
import { Student } from "@/data/students";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Search, ClipboardList, Table2, Upload, RotateCcw, Loader2,
  FileArchive, Trash2, AlertTriangle, Printer, ChevronDown, UserPlus
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { importStudentsFromExcel, importStudentListFromExcel } from "@/lib/excel-import";
import { useStudents } from "@/hooks/use-students";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import JSZip from "jszip";
import { generateBulletinPDF } from "@/lib/pdf-export";
import { BulletinPrintContent } from "@/components/BulletinPrintContent";
import { useClasse } from "@/contexts/ClasseContext";
import { FILIERES_MAP, getSemesterLabels, getSubjects } from "@/data/referentiel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type View = "s5" | "s6" | "annuel" | "liste";

const Index = () => {
  const { toast } = useToast();
  const { classeKey, filiere, niveau } = useClasse();
  const [view, setView] = useState<View>("annuel");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Student | null>(null);
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const listInputRef = useRef<HTMLInputElement>(null);
  const [exportingZip, setExportingZip] = useState(false);
  const [exportingActive, setExportingActive] = useState(false);
  const [printingAll, setPrintingAll] = useState(false);
  const [printMode, setPrintMode] = useState<"all" | "s5" | "s6" | "annuel">("annuel");
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Import Grades States
  const [isImportGradesDialogOpen, setIsImportGradesDialogOpen] = useState(false);
  const [importMode, setImportMode] = useState<"global" | "subject">("global");
  const [targetSubject, setTargetSubject] = useState<string>("all");

  // Student CRUD states
  const [isStudentDialogOpen, setIsStudentDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | undefined>(undefined);
  const [studentToDelete, setStudentToDelete] = useState<Student | undefined>(undefined);
  const [isDeleting, setIsDeleting] = useState(false);

  const { students, loading, reload } = useStudents(classeKey);
  const [labelS5, labelS6] = getSemesterLabels(niveau);

  const classeLabel = classeKey
    ? `${filiere ? FILIERES_MAP[filiere]?.libelle : filiere} ${niveau}`
    : "toutes classes";

  const handleExportZip = async (exportMode: "all" | "s5" | "s6" | "annuel" = "all") => {
    if (students.length === 0) return;
    setExportingZip(true);
    setExportingActive(true);
    const zip = new JSZip();

    try {
      toast({
        title: "Exportation en cours…",
        description: "Préparation et rendu des bulletins sélectionnés.",
      });

      await new Promise((resolve) => setTimeout(resolve, 800));

      const total = students.length;
      const batchSize = 5;

      for (let i = 0; i < total; i += batchSize) {
        const batch = students.slice(i, i + batchSize);

        await Promise.all(
          batch.map(async (student) => {
            if (exportMode === "all" || exportMode === "s5") {
              const s5El = document.getElementById(`export-s5-${student.matricule}`);
              if (s5El) {
                const pdf = await generateBulletinPDF(s5El);
                const pdfBlob = pdf.output("blob");
                zip.folder(labelS5)?.file(`${student.nom} ${student.prenom}.pdf`, pdfBlob);
              }
            }
            if (exportMode === "all" || exportMode === "s6") {
              const s6El = document.getElementById(`export-s6-${student.matricule}`);
              if (s6El) {
                const pdf = await generateBulletinPDF(s6El);
                const pdfBlob = pdf.output("blob");
                zip.folder(labelS6)?.file(`${student.nom} ${student.prenom}.pdf`, pdfBlob);
              }
            }
            if (exportMode === "all" || exportMode === "annuel") {
              const annuelEl = document.getElementById(`export-annuel-${student.matricule}`);
              if (annuelEl) {
                const pdf = await generateBulletinPDF(annuelEl);
                const pdfBlob = pdf.output("blob");
                zip.folder("Bilan Annuel")?.file(`${student.nom} ${student.prenom}.pdf`, pdfBlob);
              }
            }
          })
        );

        toast({
          title: `Génération (${Math.min(i + batchSize, total)}/${total})`,
          description: `Traitement des bulletins en cours…`,
        });
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Bulletins_INPTIC_${classeKey || "Global"}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Export réussi !",
        description: `${total} bulletins exportés.`,
      });
    } catch (err: any) {
      toast({
        title: "Erreur lors de l'export ZIP",
        description: err?.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    } finally {
      setExportingActive(false);
      setExportingZip(false);
    }
  };

  const handlePrintAll = (mode: "all" | "s5" | "s6" | "annuel" = "annuel") => {
    setPrintMode(mode);
    setPrintingAll(true);
    toast({
      title: "Préparation de l'impression...",
      description: "Veuillez patienter pendant le rendu des bulletins.",
    });
    setTimeout(() => {
      window.print();
      setPrintingAll(false);
    }, 1000);
  };

  const handleResetStudents = async () => {
    if (!classeKey) {
      toast({
        title: "Aucune classe sélectionnée",
        description: "Sélectionnez une classe avant de réinitialiser.",
        variant: "destructive",
      });
      return;
    }

    setResetting(true);
    try {
      const { data: classeData, error: classeErr } = await supabase
        .from("classes")
        .select("id")
        .eq("code", classeKey)
        .maybeSingle();

      if (classeErr || !classeData) {
        throw new Error("Classe introuvable en base de données.");
      }

      const classeId = classeData.id;
      const { data: etudiants, error: etErr } = await supabase
        .from("etudiants")
        .select("id")
        .eq("classe_id", classeId);

      if (etErr) throw etErr;

      const etudiantIds = (etudiants ?? []).map((e: any) => e.id);

      if (etudiantIds.length > 0) {
        await supabase.from("evaluations").delete().in("etudiant_id", etudiantIds);
        await supabase.from("absences").delete().in("etudiant_id", etudiantIds);
        await supabase.from("etudiants").delete().in("id", etudiantIds);
      }

      await reload();

      toast({
        title: "Liste réinitialisée",
        description: `${etudiantIds.length} étudiant(s) supprimé(s) de la classe ${classeKey}.`,
      });
    } catch (err: any) {
      toast({
        title: "Erreur de réinitialisation",
        description: err?.message || "Opération échouée.",
        variant: "destructive",
      });
    } finally {
      setResetting(false);
      setShowResetDialog(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.functions.invoke("delete-student", {
        body: { matricule: studentToDelete.matricule },
      });
      await handleEdgeError(error);
      
      toast({
        title: "Suppression réussie",
        description: `L'étudiant ${studentToDelete.nom} ${studentToDelete.prenom} a été supprimé.`,
      });
      reload();
    } catch (err: any) {
      toast({
        title: "Erreur lors de la suppression",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setStudentToDelete(undefined);
    }
  };

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

  const handleImportList = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    setImporting(true);
    try {
      toast({
        title: `Lecture de la liste…`,
        description: files.map((f) => f.name).join(", "),
      });
      const { students: parsed, warnings, info } = await importStudentListFromExcel(files, classeKey);
      if (parsed.length === 0) {
        toast({
          title: "Aucune donnée détectée",
          description: warnings[0] || "Vérifiez vos fichiers.",
          variant: "destructive",
        });
        return;
      }

      const payload = {
        defaultClasseKey: classeKey || undefined,
        students: parsed.map((s) => ({
          matricule: s.matricule,
          nom: s.nom,
          prenom: s.prenom,
          dateNaissance: s.dateNaissance ?? undefined,
          lieuNaissance: s.lieuNaissance ?? undefined,
          sexe: s.sexe ?? undefined,
          etablissement: s.etablissement ?? undefined,
          classeKey: classeKey || undefined,
          s5: {},
          s6: {},
        })),
      };

      toast({
        title: "Envoi vers le serveur…",
        description: `${parsed.length} étudiant(s) à créer/mettre à jour pour la classe ${classeLabel}.`,
      });

      const { data, error } = await supabase.functions.invoke("import-students", {
        body: payload,
      });

      if (error) throw new Error(error.message);

      await reload();

      toast({
        title: `Import réussi : ${parsed.length} étudiant(s)`,
        description: "La liste des étudiants a été mise à jour.",
      });
      if (info.length) console.log("[Import Liste]", info);
      if (warnings.length) console.warn("[Import Liste] Avertissements :", warnings);
    } catch (err: any) {
      toast({
        title: "Erreur d'import de liste",
        description: err?.message || "Fichier illisible.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      if (listInputRef.current) listInputRef.current.value = "";
      setIsImportGradesDialogOpen(false);
    }
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
      const tSubject = importMode === "subject" && targetSubject !== "all" ? targetSubject : undefined;
      const { students: parsed, warnings, info } = await importStudentsFromExcel(files, classeKey, tSubject);
      if (parsed.length === 0) {
        toast({
          title: "Aucune donnée détectée",
          description: warnings[0] || "Vérifiez vos fichiers.",
          variant: "destructive",
        });
        return;
      }

      const payload = {
        defaultClasseKey: classeKey || undefined,
        students: parsed.map((s) => ({
          matricule: s.matricule,
          nom: s.nom,
          prenom: s.prenom,
          dateNaissance: s.dateNaissance ?? undefined,
          lieuNaissance: s.lieuNaissance ?? undefined,
          sexe: (s as any).sexe ?? undefined,
          etablissement: (s as any).etablissement ?? undefined,
          classeKey: classeKey || undefined,
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
        description: `${parsed.length} étudiant(s) à enregistrer pour la classe ${classeLabel}.`,
      });

      const { data, error } = await supabase.functions.invoke("import-students", {
        body: payload,
      });

      await handleEdgeError(error);

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
      <div className="print:hidden">
        <AppHeader />
      </div>

      <main className="container mx-auto px-4 py-6 space-y-5 animate-fade-in print:hidden">
        {!classeKey && (
          <Card className="p-4 border-warning/50 bg-warning/5">
            <div className="flex items-center gap-2 text-sm text-warning">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                Aucune classe sélectionnée — les données affichées concernent <strong>tous les étudiants</strong>.
                Sélectionnez un département, une filière et un niveau dans l'en-tête pour filtrer par classe.
              </span>
            </div>
          </Card>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="default"
                onClick={() => {
                  setSelectedStudent(undefined);
                  setIsStudentDialogOpen(true);
                }}
                disabled={loading || importing || exportingZip}
                className="bg-primary text-primary-foreground hover:bg-primary-dark shadow-sm"
                title="Ajouter un étudiant manuellement"
              >
                <UserPlus className="h-4 w-4 mr-1.5" /> Nouvel Étudiant
              </Button>

              <input
                ref={listInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleImportList}
                disabled={importing}
              />
              <Button
                variant="outline"
                onClick={() => listInputRef.current?.click()}
                disabled={importing || exportingZip}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                title="Importer uniquement une liste d'étudiants (sans notes)"
              >
                {importing ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <ClipboardList className="h-4 w-4 mr-1.5" />
                )}
                Importer Liste
              </Button>

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
                onClick={() => {
                  if (!classeKey) {
                    toast({
                      title: "Aucune classe",
                      description: "Veuillez d'abord sélectionner une classe.",
                      variant: "destructive"
                    });
                    return;
                  }
                  setIsImportGradesDialogOpen(true);
                }}
                disabled={importing || exportingZip}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                title="Sélectionnez un ou plusieurs fichiers Excel avec les notes (S5 et/ou S6)"
              >
                {importing ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-1.5" />
                )}
                Importer Notes
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={loading || importing || exportingZip || printingAll || students.length === 0}
                    className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    title="Imprimer les bulletins"
                  >
                    {printingAll ? (
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    ) : (
                      <Printer className="h-4 w-4 mr-1.5" />
                    )}
                    Tout imprimer <ChevronDown className="h-4 w-4 ml-1.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => handlePrintAll("all")} className="font-medium cursor-pointer">
                    Tout ({labelS5}, {labelS6}, Annuel)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handlePrintAll("s5")} className="cursor-pointer">
                    {labelS5} uniquement
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handlePrintAll("s6")} className="cursor-pointer">
                    {labelS6} uniquement
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handlePrintAll("annuel")} className="cursor-pointer">
                    Bilan Annuel uniquement
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={loading || importing || exportingZip || printingAll || students.length === 0}
                    className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    title="Exporter les bulletins au format ZIP"
                  >
                    {exportingZip ? (
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    ) : (
                      <FileArchive className="h-4 w-4 mr-1.5" />
                    )}
                    Exporter ZIP <ChevronDown className="h-4 w-4 ml-1.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => handleExportZip("all")} className="font-medium cursor-pointer">
                    Tout ({labelS5}, {labelS6}, Annuel)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportZip("s5")} className="cursor-pointer">
                    {labelS5} uniquement
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportZip("s6")} className="cursor-pointer">
                    {labelS6} uniquement
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportZip("annuel")} className="cursor-pointer">
                    Bilan Annuel uniquement
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                onClick={() => setShowResetDialog(true)}
                disabled={loading || importing || exportingZip || !classeKey || resetting}
                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                title="Réinitialiser la liste des étudiants de cette classe"
              >
                {resetting ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-1.5" />
                )}
                Réinitialiser liste
              </Button>
              <Button variant="ghost" onClick={() => reload()} disabled={loading || importing || exportingZip}>
                <RotateCcw className="h-4 w-4 mr-1.5" /> Actualiser
              </Button>
            </div>
        </div>

        <Card className="p-4 shadow-card-soft border-border/60 bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Classe :</span>{" "}
                  <strong className="text-primary">{classeLabel}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Effectif :</span>{" "}
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

            <Card className="overflow-hidden shadow-elegant border-border/50">
              <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
                <Tabs value={view} onValueChange={(v) => setView(v as View)} className="w-full lg:w-auto">
                  <TabsList className="grid grid-cols-4 lg:w-[580px] h-11 bg-muted">
                    <TabsTrigger
                      value="s5"
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold"
                    >
                      {labelS5}
                    </TabsTrigger>
                    <TabsTrigger
                      value="s6"
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold"
                    >
                      {labelS6}
                    </TabsTrigger>
                    <TabsTrigger
                      value="annuel"
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold"
                    >
                      Bilan Annuel
                    </TabsTrigger>
                    <TabsTrigger
                      value="liste"
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold"
                    >
                      Liste d'Étudiants
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
                  {classeKey
                    ? `Aucun étudiant trouvé pour la classe ${classeLabel}. Importez un fichier Excel ou saisissez manuellement.`
                    : "Sélectionnez une classe puis importez un fichier Excel pour commencer."}
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-primary hover:bg-primary-dark w-full sm:w-auto"
                >
                  <Upload className="h-4 w-4 mr-1.5" /> Importer un fichier Excel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedStudent(undefined);
                    setIsStudentDialogOpen(true);
                  }}
                  className="w-full sm:w-auto mt-2 sm:mt-0 sm:ml-2"
                >
                  <UserPlus className="h-4 w-4 mr-1.5" /> Ajouter un étudiant
                </Button>
              </Card>
            ) : view === "liste" ? (
              <StudentListTable
                students={filtered}
                classeKey={classeKey}
                onEdit={(student) => {
                  setSelectedStudent(student);
                  setIsStudentDialogOpen(true);
                }}
                onDelete={(student) => setStudentToDelete(student)}
              />
            ) : (
              <GradesTable 
                students={filtered} 
                view={view} 
                onShowBulletin={showBulletin} 
                onEdit={(student) => {
                  setSelectedStudent(student);
                  setIsStudentDialogOpen(true);
                }}
                onDelete={(student) => setStudentToDelete(student)}
              />
            )}
        <p className="text-center text-xs text-muted-foreground pt-2">
          INPTIC · Institut National des Postes et des Technologies de l'Information et de la Communication · 2025/2026
        </p>
      </main>

      {exportingActive && (
        <div
          style={{
            position: "absolute",
            left: "-9999px",
            top: "-9999px",
            width: "800px",
            background: "white",
            zIndex: -100,
          }}
        >
          {students.map((student) => (
            <div key={student.matricule}>
              <div id={`export-s5-${student.matricule}`}>
                <BulletinPrintContent student={student} view="s5" students={students} />
              </div>
              <div id={`export-s6-${student.matricule}`}>
                <BulletinPrintContent student={student} view="s6" students={students} />
              </div>
              <div id={`export-annuel-${student.matricule}`}>
                <BulletinPrintContent student={student} view="annuel" students={students} />
              </div>
            </div>
          ))}
        </div>
      )}

      {printingAll && (
        <div className="print-area hidden print:block">
          {students.map((student, index) => {
            const viewsToPrint = printMode === "all" ? ["s5", "s6", "annuel"] : [printMode];
            return (
              <div key={student.matricule}>
                {viewsToPrint.map((v, vIndex) => {
                  const isLastStudent = index === students.length - 1;
                  const isLastView = vIndex === viewsToPrint.length - 1;
                  const pageBreak = (isLastStudent && isLastView) ? 'auto' : 'always';
                  return (
                    <div key={`${student.matricule}-${v}`} style={{ pageBreakAfter: pageBreak }}>
                      <BulletinPrintContent student={student} view={v as View} students={students} />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      <BulletinModal student={selected} view={view} open={open} onOpenChange={setOpen} students={students} />

      <StudentDialog
        open={isStudentDialogOpen}
        onOpenChange={setIsStudentDialogOpen}
        student={selectedStudent}
        onSaved={reload}
      />

      <AlertDialog open={!!studentToDelete} onOpenChange={(open) => !open && setStudentToDelete(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'étudiant <strong>{studentToDelete?.nom} {studentToDelete?.prenom}</strong> ?
              Cette action supprimera également toutes ses notes et son compte d'accès. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStudent} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isImportGradesDialogOpen} onOpenChange={setIsImportGradesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import des notes</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label>Mode d'import</Label>
              <Select value={importMode} onValueChange={(v: "global" | "subject") => setImportMode(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Import global (toutes les matières)</SelectItem>
                  <SelectItem value="subject">Import par matière</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {importMode === "subject" && (
              <div className="space-y-2">
                <Label>Matière concernée</Label>
                <Select value={targetSubject} onValueChange={setTargetSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une matière..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">-- Sélectionner --</SelectItem>
                    {getSubjects(classeKey, "s5").map(s => (
                      <SelectItem key={s.key} value={s.key}>{s.label} (S5)</SelectItem>
                    ))}
                    {getSubjects(classeKey, "s6").map(s => (
                      <SelectItem key={s.key} value={s.key}>{s.label} (S6)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button onClick={() => {
                if (importMode === "subject" && targetSubject === "all") {
                  toast({
                    title: "Action requise",
                    description: "Veuillez sélectionner une matière.",
                    variant: "destructive"
                  });
                  return;
                }
                fileInputRef.current?.click();
              }}>
                Parcourir les fichiers Excel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Réinitialiser la liste — {classeLabel}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action va <strong>supprimer définitivement</strong> tous les étudiants et leurs notes pour la classe <strong>{classeLabel}</strong>.
              <br /><br />
              Vous pourrez ensuite importer une nouvelle liste. Cette action est <strong>irréversible</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetStudents}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-1.5" /> Supprimer tout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
