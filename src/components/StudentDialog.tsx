import { useState, useEffect } from "react";
import { Student } from "@/data/students";
import { useClasse } from "@/contexts/ClasseContext";
import { getSubjects } from "@/data/referentiel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { handleEdgeError } from "@/lib/utils";

interface StudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: Student;
  onSaved: () => void;
}

export const StudentDialog = ({ open, onOpenChange, student, onSaved }: StudentDialogProps) => {
  const { classeKey } = useClasse();
  const { toast } = useToast();
  const isEdit = !!student;

  const [saving, setSaving] = useState(false);

  const [identity, setIdentity] = useState({
    matricule: "",
    nom: "",
    prenom: "",
    dateNaissance: "",
    lieuNaissance: "",
    sexe: "",
    etablissement: "",
  });

  const subjectsS5 = getSubjects(classeKey, "s5");
  const subjectsS6 = getSubjects(classeKey, "s6");

  const [notesS5, setNotesS5] = useState<Record<string, { cc: string; exam: string; rattrapage: string }>>({});
  const [notesS6, setNotesS6] = useState<Record<string, { cc: string; exam: string; rattrapage: string }>>({});
  const [absenceS5, setAbsenceS5] = useState("0");
  const [absenceS6, setAbsenceS6] = useState("0");

  useEffect(() => {
    if (open) {
      if (student) {
        setIdentity({
          matricule: student.matricule || "",
          nom: student.nom || "",
          prenom: student.prenom || "",
          dateNaissance: student.dateNaissance || "",
          lieuNaissance: student.lieuNaissance || "",
          sexe: student.sexe || "",
          etablissement: student.etablissement || "",
        });

        // Fonction pour extraire CC, Examen, Rattrapage depuis Supabase si stocké.
        // Or, notre objet Student actuel stocke uniquement la note finale dans `s5[code]` et `s6[code]` après fetchStudents !
        // Ah. Problème : `fetchStudents` ne renvoie QUE la note finale (computeMoy) et pas le détail CC/Examen/Rattrapage.
        // Si l'utilisateur veut éditer, il écrasera les CC/Examen s'il ne les voit pas.
        // Pour contourner, on va faire un fetch spécifique pour cet étudiant à l'ouverture, ou on stockera ce qu'on peut.
        // Par simplicité, on préremplit les champs "Examen" avec la note finale si existante (ce qui correspond à l'import Excel).
        const ns5: Record<string, any> = {};
        subjectsS5.forEach((s) => {
          ns5[s.key] = { cc: "", exam: student.s5?.[s.key] !== undefined ? String(student.s5[s.key]) : "", rattrapage: "" };
        });
        setNotesS5(ns5);

        const ns6: Record<string, any> = {};
        subjectsS6.forEach((s) => {
          ns6[s.key] = { cc: "", exam: student.s6?.[s.key] !== undefined ? String(student.s6[s.key]) : "", rattrapage: "" };
        });
        setNotesS6(ns6);
        
        // Les absences ne sont pas stockées dans la BDD actuellement (c'est un TODO de la maquette), on met à 0.
        setAbsenceS5("0");
        setAbsenceS6("0");
      } else {
        setIdentity({ matricule: "", nom: "", prenom: "", dateNaissance: "", lieuNaissance: "", sexe: "", etablissement: "" });
        const ns5: Record<string, any> = {};
        subjectsS5.forEach((s) => (ns5[s.key] = { cc: "", exam: "", rattrapage: "" }));
        setNotesS5(ns5);

        const ns6: Record<string, any> = {};
        subjectsS6.forEach((s) => (ns6[s.key] = { cc: "", exam: "", rattrapage: "" }));
        setNotesS6(ns6);
        setAbsenceS5("0");
        setAbsenceS6("0");
      }
    }
  }, [open, student, classeKey]);

  // Si l'utilisateur édite un étudiant, nous aurions besoin du fetch complet de ses évaluations pour bien préremplir CC/Examen/Rattrapage.
  // Faisons un fetch des notes réelles pour cet étudiant lorsqu'on l'ouvre en édition !
  useEffect(() => {
    async function loadRealGrades() {
      if (open && student) {
        const { data: evals } = await supabase
          .from("evaluations")
          .select("matiere_id, note, type, matieres(code)")
          .eq("etudiant_id", student.matricule); // Attendez, etudiant_id est l'UUID de l'étudiant.
          
        // Bon, utilisons plutôt la jointure depuis etudiants
        const { data: fullStudent } = await supabase
          .from("etudiants")
          .select("id, evaluations(note, type, matieres(code))")
          .eq("matricule", student.matricule)
          .single();

        if (fullStudent?.evaluations) {
          const ns5 = { ...notesS5 };
          const ns6 = { ...notesS6 };
          
          fullStudent.evaluations.forEach((ev: any) => {
            const code = ev.matieres?.code;
            if (!code) return;
            const noteStr = String(ev.note);
            
            if (subjectsS5.some(s => s.key === code)) {
              if (ev.type === "cc") ns5[code] = { ...ns5[code], cc: noteStr };
              if (ev.type === "examen") ns5[code] = { ...ns5[code], exam: noteStr };
              if (ev.type === "rattrapage") ns5[code] = { ...ns5[code], rattrapage: noteStr };
            } else if (subjectsS6.some(s => s.key === code)) {
              if (ev.type === "cc") ns6[code] = { ...ns6[code], cc: noteStr };
              if (ev.type === "examen") ns6[code] = { ...ns6[code], exam: noteStr };
              if (ev.type === "rattrapage") ns6[code] = { ...ns6[code], rattrapage: noteStr };
            }
          });
          
          setNotesS5(ns5);
          setNotesS6(ns6);
        }
      }
    }
    loadRealGrades();
  }, [open, student]);


  const handleSave = async () => {
    if (!identity.matricule.trim() || !identity.nom.trim() || !identity.prenom.trim()) {
      toast({ title: "Champs requis", description: "Le matricule, nom et prénom sont obligatoires.", variant: "destructive" });
      return;
    }

    if (identity.dateNaissance && !/^\d{4}-\d{2}-\d{2}$/.test(identity.dateNaissance)) {
      toast({ title: "Format invalide", description: "La date de naissance doit être au format YYYY-MM-DD (ex: 2001-03-12).", variant: "destructive" });
      return;
    }

    // Vérification des notes invalides
    let hasInvalidGrades = false;
    const checkNotes = (notesObj: any) => {
      Object.values(notesObj).forEach((e: any) => {
        if (isInvalidGrade(e.cc) || isInvalidGrade(e.exam) || isInvalidGrade(e.rattrapage)) {
          hasInvalidGrades = true;
        }
      });
    };
    checkNotes(notesS5);
    checkNotes(notesS6);

    if (hasInvalidGrades) {
      toast({ 
        title: "Notes invalides", 
        description: "Veuillez corriger les notes en rouge. Les notes doivent être comprises entre 0 et 20.", 
        variant: "destructive" 
      });
      return;
    }

    setSaving(true);
    try {
      const buildPayload = (notesObj: any) => {
        const payload: Record<string, any> = {};
        Object.entries(notesObj).forEach(([code, e]: [string, any]) => {
          const v: any = {};
          const cc = parseFloat((e.cc || "").replace(",", "."));
          const ex = parseFloat((e.exam || "").replace(",", "."));
          const rat = parseFloat((e.rattrapage || "").replace(",", "."));
          if (!isNaN(cc)) v.cc = cc;
          if (!isNaN(ex)) v.examen = ex;
          if (!isNaN(rat)) v.rattrapage = rat;
          if (Object.keys(v).length > 0) payload[code] = v;
        });
        return payload;
      };

      const payloadS5 = buildPayload(notesS5);
      const payloadS6 = buildPayload(notesS6);

      // On sauvegarde S5
      const { error: errS5 } = await supabase.functions.invoke("save-grades", {
        body: {
          identity: { ...identity, classeKey },
          semestre: "s5",
          notes: payloadS5,
          absenceHeures: parseFloat(absenceS5.replace(",", ".")) || 0,
        },
      });
      await handleEdgeError(errS5);

      // On sauvegarde S6
      const { error: errS6 } = await supabase.functions.invoke("save-grades", {
        body: {
          identity: { ...identity, classeKey },
          semestre: "s6",
          notes: payloadS6,
          absenceHeures: parseFloat(absenceS6.replace(",", ".")) || 0,
        },
      });
      await handleEdgeError(errS6);

      toast({ title: "Succès", description: `Étudiant ${isEdit ? "modifié" : "ajouté"} avec succès.` });
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const isInvalidGrade = (val: string) => {
    if (!val) return false;
    const num = parseFloat(val.replace(",", "."));
    return isNaN(num) || num > 20 || num < 0;
  };

  const renderSubjectInputs = (
    subjects: any[],
    notes: Record<string, any>,
    setNotes: React.Dispatch<React.SetStateAction<any>>
  ) => {
    return (
      <div className="space-y-4">
        {subjects.map((s) => {
          const ccInvalid = isInvalidGrade(notes[s.key]?.cc);
          const examInvalid = isInvalidGrade(notes[s.key]?.exam);
          const rattrapageInvalid = isInvalidGrade(notes[s.key]?.rattrapage);

          return (
            <div key={s.key} className="grid grid-cols-[1fr_80px_80px_80px] gap-2 items-center">
              <Label className="text-xs">
                {s.key} ({(s.credits || s.coef)} Crédit{(s.credits || s.coef) > 1 ? 's' : ''})
              </Label>
              <Input
                placeholder="CC"
                className={`h-8 text-center text-sm ${ccInvalid ? 'border-destructive bg-destructive/10 text-destructive' : ''}`}
                value={notes[s.key]?.cc || ""}
                onChange={(e) => setNotes({ ...notes, [s.key]: { ...notes[s.key], cc: e.target.value } })}
              />
              <Input
                placeholder="Exam"
                className={`h-8 text-center text-sm font-semibold ${examInvalid ? 'border-destructive bg-destructive/10 text-destructive' : ''}`}
                value={notes[s.key]?.exam || ""}
                onChange={(e) => setNotes({ ...notes, [s.key]: { ...notes[s.key], exam: e.target.value } })}
              />
              <Input
                placeholder="Rat."
                className={`h-8 text-center text-sm text-destructive ${rattrapageInvalid ? 'border-destructive bg-destructive/10 text-destructive' : ''}`}
                value={notes[s.key]?.rattrapage || ""}
                onChange={(e) => setNotes({ ...notes, [s.key]: { ...notes[s.key], rattrapage: e.target.value } })}
              />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier l'étudiant" : "Nouvel étudiant"}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="identity" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="identity">Identité</TabsTrigger>
            <TabsTrigger value="s5">Semestre 5</TabsTrigger>
            <TabsTrigger value="s6">Semestre 6</TabsTrigger>
          </TabsList>

          <TabsContent value="identity" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Matricule *</Label>
                <Input
                  disabled={isEdit} // Le matricule est la clé primaire métier, on ne le modifie pas facilement
                  value={identity.matricule}
                  onChange={(e) => setIdentity({ ...identity, matricule: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Nom *</Label>
                <Input
                  value={identity.nom}
                  onChange={(e) => setIdentity({ ...identity, nom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Prénom *</Label>
                <Input
                  value={identity.prenom}
                  onChange={(e) => setIdentity({ ...identity, prenom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Date de naissance</Label>
                <Input
                  placeholder="Ex: 01/01/2000"
                  value={identity.dateNaissance}
                  onChange={(e) => setIdentity({ ...identity, dateNaissance: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Lieu de naissance</Label>
                <Input
                  value={identity.lieuNaissance}
                  onChange={(e) => setIdentity({ ...identity, lieuNaissance: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Sexe</Label>
                <Input
                  value={identity.sexe}
                  onChange={(e) => setIdentity({ ...identity, sexe: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Établissement d'origine</Label>
                <Input
                  value={identity.etablissement}
                  onChange={(e) => setIdentity({ ...identity, etablissement: e.target.value })}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="s5" className="mt-4">
            {renderSubjectInputs(subjectsS5, notesS5, setNotesS5)}
            <div className="mt-6 flex items-center gap-4">
              <Label>Heures d'absence (S5)</Label>
              <Input
                className="w-24 h-8 text-center"
                value={absenceS5}
                onChange={(e) => setAbsenceS5(e.target.value)}
              />
            </div>
          </TabsContent>

          <TabsContent value="s6" className="mt-4">
            {renderSubjectInputs(subjectsS6, notesS6, setNotesS6)}
            <div className="mt-6 flex items-center gap-4">
              <Label>Heures d'absence (S6)</Label>
              <Input
                className="w-24 h-8 text-center"
                value={absenceS6}
                onChange={(e) => setAbsenceS6(e.target.value)}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
