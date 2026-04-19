import { useMemo, useState } from "react";
import { z } from "zod";
import {
  STUDENTS,
  Student,
  S5_SUBJECTS,
  S6_SUBJECTS,
} from "@/data/students";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, RotateCcw, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type Sem = "s5" | "s6";

// Validation : note 0-20, absence >= 0
const noteSchema = z
  .number({ invalid_type_error: "Doit être un nombre" })
  .min(0, "Min 0")
  .max(20, "Max 20");
const absenceSchema = z
  .number({ invalid_type_error: "Heures invalides" })
  .min(0, "Min 0")
  .max(200, "Max 200h");

interface SubjectEntry {
  cc: string;
  exam: string;
}

const STORAGE_KEY = "inptic_grade_entries_v1";

const loadEntries = (): Record<string, any> => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
};

const saveEntries = (data: Record<string, any>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const buildEmpty = (subjects: readonly any[]): Record<string, SubjectEntry> => {
  const o: Record<string, SubjectEntry> = {};
  subjects.forEach((s) => {
    o[s.key] = { cc: "", exam: "" };
  });
  return o;
};

export const GradeEntry = () => {
  const { toast } = useToast();
  const [studentId, setStudentId] = useState<string>(STUDENTS[0].matricule);
  const [sem, setSem] = useState<Sem>("s5");
  const [absence, setAbsence] = useState<string>("0");
  const subjects = sem === "s5" ? S5_SUBJECTS : S6_SUBJECTS;

  // entrées : par étudiant > par semestre > par matière
  const [entries, setEntries] = useState<Record<string, any>>(() => loadEntries());

  const student = useMemo(
    () => STUDENTS.find((s) => s.matricule === studentId)!,
    [studentId]
  );

  const key = `${studentId}_${sem}`;
  const current: Record<string, SubjectEntry> =
    entries[key]?.notes || buildEmpty(subjects);
  const currentAbs: string = entries[key]?.absence ?? "0";

  // Synchronise quand on change étudiant/semestre
  if (entries[key]?.absence !== undefined && currentAbs !== absence && absence === "0") {
    // ne rien faire — on laisse l'utilisateur contrôler
  }

  const setNote = (subjectKey: string, field: "cc" | "exam", value: string) => {
    const updated = {
      ...entries,
      [key]: {
        notes: { ...current, [subjectKey]: { ...current[subjectKey], [field]: value } },
        absence: entries[key]?.absence ?? absence,
      },
    };
    setEntries(updated);
  };

  const updateAbsence = (value: string) => {
    setAbsence(value);
    setEntries({
      ...entries,
      [key]: {
        notes: current,
        absence: value,
      },
    });
  };

  // Calcul moyenne par matière : CC*0.4 + Exam*0.6
  const moyMatiere = (e: SubjectEntry): number | null => {
    const cc = parseFloat(e.cc.replace(",", "."));
    const ex = parseFloat(e.exam.replace(",", "."));
    if (isNaN(cc) && isNaN(ex)) return null;
    if (isNaN(cc) || isNaN(ex)) return null;
    return cc * 0.4 + ex * 0.6;
  };

  // Validation par champ
  const validateNote = (val: string): string | null => {
    if (val.trim() === "") return null;
    const n = parseFloat(val.replace(",", "."));
    const r = noteSchema.safeParse(n);
    return r.success ? null : r.error.issues[0].message;
  };

  // Erreurs en direct
  const errors = useMemo(() => {
    const e: Record<string, { cc?: string; exam?: string }> = {};
    Object.entries(current).forEach(([k, v]) => {
      const cc = validateNote(v.cc);
      const ex = validateNote(v.exam);
      if (cc || ex) e[k] = { cc: cc || undefined, exam: ex || undefined };
    });
    return e;
  }, [current]);

  const absenceError = useMemo(() => {
    if (absence.trim() === "") return null;
    const n = parseFloat(absence.replace(",", "."));
    const r = absenceSchema.safeParse(n);
    return r.success ? null : r.error.issues[0].message;
  }, [absence]);

  // Moyennes UE & semestre (avec malus 0.01/h)
  const computed = useMemo(() => {
    const ues = Array.from(new Set(subjects.map((s) => s.ue)));
    const ueResults = ues.map((ue) => {
      const subs = subjects.filter((s) => s.ue === ue);
      let sum = 0,
        coef = 0,
        complete = true;
      subs.forEach((s) => {
        const m = moyMatiere(current[s.key]);
        if (m === null) complete = false;
        else {
          sum += m * s.coef;
          coef += s.coef;
        }
      });
      return { ue, moy: coef ? sum / coef : null, complete, totalCoef: subs.reduce((a, b) => a + b.coef, 0) };
    });
    const totalCoef = subjects.reduce((a, b) => a + b.coef, 0);
    let sum = 0,
      coef = 0,
      allComplete = true;
    subjects.forEach((s) => {
      const m = moyMatiere(current[s.key]);
      if (m === null) allComplete = false;
      else {
        sum += m * s.coef;
        coef += s.coef;
      }
    });
    const brute = coef ? sum / coef : null;
    const absH = parseFloat(absence.replace(",", ".")) || 0;
    const malus = absH * 0.01;
    const finale = brute === null ? null : Math.max(0, brute - malus);
    return { ueResults, brute, malus, finale, totalCoef, allComplete };
  }, [current, absence, subjects]);

  const hasErrors = Object.keys(errors).length > 0 || !!absenceError;

  const handleSave = () => {
    if (hasErrors) {
      toast({
        title: "Erreurs de saisie",
        description: "Corrigez les notes invalides avant d'enregistrer.",
        variant: "destructive",
      });
      return;
    }
    saveEntries(entries);
    toast({
      title: "Notes enregistrées",
      description: `${student.nom} ${student.prenom} — Semestre ${sem === "s5" ? "5" : "6"}`,
    });
  };

  const handleReset = () => {
    const updated = { ...entries };
    delete updated[key];
    setEntries(updated);
    saveEntries(updated);
    setAbsence("0");
    toast({ title: "Saisie réinitialisée", description: "Les notes ont été effacées." });
  };

  return (
    <div className="space-y-4">
      {/* Sélecteurs */}
      <Card className="p-4 shadow-card-soft border-border/60">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Étudiant
            </Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {STUDENTS.map((s) => (
                  <SelectItem key={s.matricule} value={s.matricule}>
                    <span className="font-mono text-xs text-primary mr-2">{s.matricule}</span>
                    {s.nom} {s.prenom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Semestre
            </Label>
            <Select value={sem} onValueChange={(v) => setSem(v as Sem)}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="s5">Semestre 5</SelectItem>
                <SelectItem value="s6">Semestre 6</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Heures d'absence (malus 0,01/h)
            </Label>
            <Input
              type="number"
              min={0}
              max={200}
              step={1}
              value={absence}
              onChange={(e) => updateAbsence(e.target.value)}
              className={cn("h-11", absenceError && "border-destructive")}
            />
            {absenceError && (
              <p className="text-[11px] text-destructive mt-1">{absenceError}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Tableau de saisie */}
      <Card className="overflow-hidden shadow-elegant border-border/60">
        <div className="px-4 py-3 bg-gradient-header text-primary-foreground flex items-center justify-between">
          <div>
            <h3 className="font-semibold">
              Saisie des notes — {student.nom} {student.prenom}
            </h3>
            <p className="text-xs opacity-90">
              Pondération : Contrôle Continu <strong>40%</strong> · Examen Final{" "}
              <strong>60%</strong>
            </p>
          </div>
          <div className="text-right text-xs opacity-90">
            <p className="font-mono">{student.matricule}</p>
            <p>Semestre {sem === "s5" ? "5" : "6"}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-b border-border">
                <th className="text-left px-3 py-2 font-semibold w-[35%]">Matière</th>
                <th className="text-center px-2 py-2 font-semibold w-14">UE</th>
                <th className="text-center px-2 py-2 font-semibold w-14">Coef</th>
                <th className="text-center px-2 py-2 font-semibold">CC (40%)</th>
                <th className="text-center px-2 py-2 font-semibold">Examen (60%)</th>
                <th className="text-center px-2 py-2 font-semibold">Moyenne</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((s, i) => {
                const e = current[s.key];
                const m = moyMatiere(e);
                const err = errors[s.key];
                return (
                  <tr
                    key={s.key}
                    className={cn(
                      "border-b border-border/40",
                      i % 2 === 0 ? "bg-card" : "bg-muted/30"
                    )}
                  >
                    <td className="px-3 py-2">{s.label}</td>
                    <td className="text-center px-2 py-2 text-xs text-muted-foreground">
                      {s.ue}
                    </td>
                    <td className="text-center px-2 py-2 font-mono text-xs">{s.coef}</td>
                    <td className="px-2 py-1.5">
                      <Input
                        type="number"
                        min={0}
                        max={20}
                        step={0.01}
                        placeholder="—"
                        value={e.cc}
                        onChange={(ev) => setNote(s.key, "cc", ev.target.value)}
                        className={cn(
                          "h-9 text-center tabular-nums",
                          err?.cc && "border-destructive"
                        )}
                      />
                      {err?.cc && (
                        <p className="text-[10px] text-destructive mt-0.5">{err.cc}</p>
                      )}
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        type="number"
                        min={0}
                        max={20}
                        step={0.01}
                        placeholder="—"
                        value={e.exam}
                        onChange={(ev) => setNote(s.key, "exam", ev.target.value)}
                        className={cn(
                          "h-9 text-center tabular-nums",
                          err?.exam && "border-destructive"
                        )}
                      />
                      {err?.exam && (
                        <p className="text-[10px] text-destructive mt-0.5">{err.exam}</p>
                      )}
                    </td>
                    <td className="text-center px-2 py-2">
                      {m === null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <span
                          className={cn(
                            "tabular-nums font-bold px-2 py-0.5 rounded",
                            m < 10
                              ? "bg-destructive/10 text-destructive"
                              : m >= 14
                              ? "bg-success/10 text-success"
                              : "bg-muted text-foreground"
                          )}
                        >
                          {m.toFixed(2)}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              {computed.ueResults.map((u) => (
                <tr key={u.ue} className="bg-primary/5 border-t border-primary/20">
                  <td colSpan={3} className="px-3 py-2 font-semibold text-right text-primary">
                    Moyenne {u.ue}
                  </td>
                  <td colSpan={2} className="px-2 py-2 text-center text-xs text-muted-foreground">
                    {u.complete ? "complète" : "saisie incomplète"}
                  </td>
                  <td className="text-center px-2 py-2">
                    {u.moy === null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span
                        className={cn(
                          "tabular-nums font-bold",
                          u.moy < 10 ? "text-destructive" : "text-primary"
                        )}
                      >
                        {u.moy.toFixed(2)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="bg-primary text-primary-foreground">
                <td colSpan={3} className="px-3 py-3 font-bold uppercase text-right">
                  Moyenne brute du Semestre
                </td>
                <td colSpan={2} className="px-2 py-3 text-center text-xs">
                  Malus absence : −{computed.malus.toFixed(2)}
                </td>
                <td className="text-center px-2 py-3 text-lg tabular-nums font-bold">
                  {computed.brute === null ? "—" : computed.brute.toFixed(2)}
                </td>
              </tr>
              <tr className="bg-primary-dark text-primary-foreground">
                <td colSpan={5} className="px-3 py-3 font-bold uppercase text-right">
                  Moyenne finale Semestre {sem === "s5" ? "5" : "6"} (après malus)
                </td>
                <td className="text-center px-2 py-3">
                  {computed.finale === null ? (
                    <span className="text-lg">—</span>
                  ) : (
                    <span
                      className={cn(
                        "inline-block px-3 py-1 rounded-md text-xl font-bold tabular-nums",
                        computed.finale >= 10 ? "bg-success" : "bg-destructive"
                      )}
                    >
                      {computed.finale.toFixed(2)}
                    </span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          {hasErrors ? (
            <>
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span>Corrigez les erreurs de saisie pour pouvoir enregistrer.</span>
            </>
          ) : computed.allComplete ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span>Saisie complète — prête à être enregistrée.</span>
            </>
          ) : (
            <span>Notes entre 0 et 20. Sauvegarde locale (navigateur).</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-1.5" /> Réinitialiser
          </Button>
          <Button onClick={handleSave} disabled={hasErrors} className="bg-primary">
            <Save className="h-4 w-4 mr-1.5" /> Enregistrer la saisie
          </Button>
        </div>
      </div>
    </div>
  );
};
