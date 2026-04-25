import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { S5_SUBJECTS, S6_SUBJECTS } from "@/data/students";
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
import { Save, RotateCcw, AlertCircle, CheckCircle2, UserPlus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { saveIdentity as persistIdentity, loadIdentity } from "@/lib/identity-store";
import { supabase } from "@/integrations/supabase/client";


type Sem = "s5" | "s6";

const noteSchema = z.number().min(0, "0-20").max(20, "0-20");
const absenceSchema = z.number().min(0).max(500);

interface SubjectEntry {
  cc: string;
  exam: string;
  rattrapage: string;
}

interface IdentityForm {
  matricule: string; // auto-généré, sert d'identifiant de connexion
  nom: string;
  prenom: string;
  dateNaissance: string;
  lieuNaissance: string;
  bac: string;
  etablissement: string;
}

const STORAGE_KEY = "inptic_grade_entries_v2";

const loadEntries = (): Record<string, any> => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
};
const saveEntries = (data: Record<string, any>) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

const buildEmpty = (subjects: readonly any[]): Record<string, SubjectEntry> => {
  const o: Record<string, SubjectEntry> = {};
  subjects.forEach((s) => (o[s.key] = { cc: "", exam: "", rattrapage: "" }));
  return o;
};

// Génère un matricule de connexion stable depuis prénom + nom
const slugify = (s: string) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
const buildMatricule = (prenom: string, nom: string) => {
  const p = slugify(prenom);
  const n = slugify(nom);
  if (!p || !n) return "";
  return `${p}_${n}`.toUpperCase();
};

const emptyIdentity: IdentityForm = {
  matricule: "",
  nom: "",
  prenom: "",
  dateNaissance: "",
  lieuNaissance: "",
  bac: "",
  etablissement: "",
};

interface GradeEntryProps {
  onSaved?: () => void | Promise<void>;
  onGoToDashboard?: () => void;
}

export const GradeEntry = ({ onSaved, onGoToDashboard }: GradeEntryProps = {}) => {
  const { toast } = useToast();
  const [identity, setIdentity] = useState<IdentityForm>(emptyIdentity);
  const [sem, setSem] = useState<Sem>("s5");
  const [absence, setAbsence] = useState("0");
  const [saving, setSaving] = useState(false);
  const subjects = sem === "s5" ? S5_SUBJECTS : S6_SUBJECTS;
  const [entries, setEntries] = useState<Record<string, any>>(() => loadEntries());


  // Génère automatiquement le matricule de connexion à partir de nom + prénom
  useEffect(() => {
    const m = buildMatricule(identity.prenom, identity.nom);
    if (m && m !== identity.matricule) {
      setIdentity((cur) => ({ ...cur, matricule: m }));
    }
    if (!m && identity.matricule) {
      setIdentity((cur) => ({ ...cur, matricule: "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity.nom, identity.prenom]);

  // Pré-remplit identité depuis store partagé quand le matricule existe déjà
  useEffect(() => {
    if (!identity.matricule) return;
    const existing = loadIdentity(identity.matricule);
    if (existing.nom || existing.prenom) {
      setIdentity((cur) => ({
        matricule: cur.matricule,
        nom: cur.nom || existing.nom || "",
        prenom: cur.prenom || existing.prenom || "",
        dateNaissance: cur.dateNaissance || existing.dateNaissance || "",
        lieuNaissance: cur.lieuNaissance || existing.lieuNaissance || "",
        bac: cur.bac || existing.bac || "",
        etablissement: cur.etablissement || existing.etablissement || "",
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity.matricule]);

  const sessionKey = identity.matricule
    ? `${identity.matricule}_${sem}`
    : `__draft__${sem}`;
  const current: Record<string, SubjectEntry> =
    entries[sessionKey]?.notes || buildEmpty(subjects);

  const setNote = (
    subjectKey: string,
    field: "cc" | "exam" | "rattrapage",
    value: string
  ) => {
    setEntries({
      ...entries,
      [sessionKey]: {
        identity,
        absence,
        notes: {
          ...current,
          [subjectKey]: { ...current[subjectKey], [field]: value },
        },
      },
    });
  };

  const updateAbsence = (v: string) => {
    setAbsence(v);
    setEntries({ ...entries, [sessionKey]: { identity, absence: v, notes: current } });
  };

  // Logique : si rattrapage saisi → moyenne = max(originale, note rattrapage)
  // Originale = CC*0.4 + Exam*0.6
  const moyMatiere = (e: SubjectEntry): number | null => {
    const cc = parseFloat(e.cc.replace(",", "."));
    const ex = parseFloat(e.exam.replace(",", "."));
    const rat = parseFloat(e.rattrapage.replace(",", "."));
    const hasRat = !isNaN(rat);
    if (isNaN(cc) || isNaN(ex)) {
      // Si seul le rattrapage est saisi, on l'utilise comme note finale
      if (hasRat) return rat;
      return null;
    }
    const originale = cc * 0.4 + ex * 0.6;
    if (hasRat) return Math.max(originale, rat);
    return originale;
  };

  const validateNote = (val: string): string | null => {
    if (val.trim() === "") return null;
    const n = parseFloat(val.replace(",", "."));
    const r = noteSchema.safeParse(n);
    return r.success ? null : r.error.issues[0].message;
  };

  const errors = useMemo(() => {
    const e: Record<string, { cc?: string; exam?: string; rattrapage?: string }> = {};
    Object.entries(current).forEach(([k, v]) => {
      const cc = validateNote(v.cc);
      const ex = validateNote(v.exam);
      const rat = validateNote(v.rattrapage);
      if (cc || ex || rat)
        e[k] = {
          cc: cc || undefined,
          exam: ex || undefined,
          rattrapage: rat || undefined,
        };
    });
    return e;
  }, [current]);

  const absenceError = useMemo(() => {
    if (absence.trim() === "") return null;
    const n = parseFloat(absence.replace(",", "."));
    const r = absenceSchema.safeParse(n);
    return r.success ? null : "0-500h";
  }, [absence]);

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
      return { ue, moy: coef ? sum / coef : null, complete };
    });
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
    return { ueResults, brute, malus, finale, allComplete };
  }, [current, absence, subjects]);

  const identityComplete =
    identity.matricule.trim() !== "" &&
    identity.nom.trim() !== "" &&
    identity.prenom.trim() !== "";

  const hasErrors = Object.keys(errors).length > 0 || !!absenceError;

  const handleSave = async () => {
    if (!identityComplete) {
      toast({
        title: "Identité incomplète",
        description: "Renseignez au minimum le nom et le prénom.",
        variant: "destructive",
      });
      return;
    }
    if (hasErrors) {
      toast({
        title: "Erreurs de saisie",
        description: "Corrigez les notes invalides (0–20).",
        variant: "destructive",
      });
      return;
    }

    // Sauvegarde locale (brouillon)
    const data = { ...entries, [sessionKey]: { identity, absence, notes: current } };
    setEntries(data);
    saveEntries(data);
    persistIdentity(identity.matricule, {
      nom: identity.nom,
      prenom: identity.prenom,
      dateNaissance: identity.dateNaissance,
      lieuNaissance: identity.lieuNaissance,
      bac: identity.bac,
      etablissement: identity.etablissement,
    });

    // Construit le payload pour l'edge function
    const notesPayload: Record<string, { cc?: number; examen?: number; rattrapage?: number }> = {};
    Object.entries(current).forEach(([code, e]) => {
      const v: any = {};
      const cc = parseFloat((e.cc || "").replace(",", "."));
      const ex = parseFloat((e.exam || "").replace(",", "."));
      const rat = parseFloat((e.rattrapage || "").replace(",", "."));
      if (!isNaN(cc)) v.cc = cc;
      if (!isNaN(ex)) v.examen = ex;
      if (!isNaN(rat)) v.rattrapage = rat;
      if (Object.keys(v).length > 0) notesPayload[code] = v;
    });

    setSaving(true);
    try {
      const { data: resp, error } = await supabase.functions.invoke("save-grades", {
        body: {
          identity: {
            matricule: identity.matricule.trim(),
            nom: identity.nom.trim(),
            prenom: identity.prenom.trim(),
            dateNaissance: identity.dateNaissance || undefined,
            lieuNaissance: identity.lieuNaissance || undefined,
            bac: identity.bac || undefined,
            etablissement: identity.etablissement || undefined,
          },
          semestre: sem,
          absenceHeures: parseFloat(absence.replace(",", ".")) || 0,
          notes: notesPayload,
        },
      });
      if (error) throw new Error(error.message);
      if (resp?.error) throw new Error(resp.error);

      toast({
        title: "Notes enregistrées",
        description: `${identity.nom} ${identity.prenom} — ${resp?.savedNotes ?? 0} note(s) sauvegardée(s)${resp?.accountCreated ? " · compte créé" : ""}.`,
      });
      if (resp?.errors?.length) console.warn("[save-grades]", resp.errors);
      // Recharge le tableau de bord parent pour refléter la saisie
      try { await onSaved?.(); } catch (e) { console.warn("[onSaved]", e); }
    } catch (err: any) {
      toast({
        title: "Erreur d'enregistrement",
        description: err?.message || "Impossible d'enregistrer.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };


  const handleReset = () => {
    const updated = { ...entries };
    delete updated[sessionKey];
    setEntries(updated);
    saveEntries(updated);
    setAbsence("0");
    toast({ title: "Saisie réinitialisée" });
  };

  const handleNewStudent = () => {
    setIdentity(emptyIdentity);
    setAbsence("0");
    toast({ title: "Nouvelle saisie", description: "Formulaire vidé." });
  };

  return (
    <div className="space-y-4">
      {/* Identité étudiant — champs libres */}
      <Card className="p-4 shadow-card-soft border-border/60">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-primary">Identité de l'étudiant</h3>
          <Button variant="outline" size="sm" onClick={handleNewStudent}>
            <UserPlus className="h-4 w-4 mr-1.5" /> Nouvel étudiant
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Nom *</Label>
            <Input
              placeholder="NOM"
              value={identity.nom}
              onChange={(e) => setIdentity({ ...identity, nom: e.target.value })}
              className="h-10"
            />
          </div>
          <div>
            <Label className="text-xs">Prénom *</Label>
            <Input
              placeholder="Prénom"
              value={identity.prenom}
              onChange={(e) => setIdentity({ ...identity, prenom: e.target.value })}
              className="h-10"
            />
          </div>
        </div>
        {identity.matricule && (
          <p className="text-[11px] text-muted-foreground mt-2">
            Identifiant de connexion généré :{" "}
            <span className="font-mono font-semibold text-foreground">
              {identity.matricule}
            </span>{" "}
            · mot de passe = identifiant
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <div>
            <Label className="text-xs">Date de naissance</Label>
            <Input
              type="date"
              value={identity.dateNaissance}
              onChange={(e) => setIdentity({ ...identity, dateNaissance: e.target.value })}
              className="h-10"
            />
          </div>
          <div>
            <Label className="text-xs">Lieu de naissance</Label>
            <Input
              placeholder="Ex. Libreville"
              value={identity.lieuNaissance}
              onChange={(e) => setIdentity({ ...identity, lieuNaissance: e.target.value })}
              className="h-10"
            />
          </div>
        </div>
      </Card>

      {/* Sélecteurs semestre / absence */}
      <Card className="p-4 shadow-card-soft border-border/60">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              max={500}
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
              Saisie des notes — {identity.nom || "—"} {identity.prenom}
            </h3>
            <p className="text-xs opacity-90">
              CC <strong>40%</strong> · Examen <strong>60%</strong> · Rattrapage : remplace si supérieur
            </p>
          </div>
          <div className="text-right text-xs opacity-90">
            <p className="font-mono">{identity.matricule || "—"}</p>
            <p>Semestre {sem === "s5" ? "5" : "6"}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-b border-border">
                <th className="text-left px-3 py-2 font-semibold w-[30%]">Matière</th>
                <th className="text-center px-2 py-2 font-semibold w-12">UE</th>
                <th className="text-center px-2 py-2 font-semibold w-12">Coef</th>
                <th className="text-center px-2 py-2 font-semibold">CC (40%)</th>
                <th className="text-center px-2 py-2 font-semibold">Examen (60%)</th>
                <th className="text-center px-2 py-2 font-semibold">Rattrapage</th>
                <th className="text-center px-2 py-2 font-semibold">Moyenne</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((s, i) => {
                const e = current[s.key];
                const m = moyMatiere(e);
                const err = errors[s.key];
                const hasRat = e.rattrapage.trim() !== "";
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
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        type="number"
                        min={0}
                        max={20}
                        step={0.01}
                        placeholder="—"
                        value={e.rattrapage}
                        onChange={(ev) =>
                          setNote(s.key, "rattrapage", ev.target.value)
                        }
                        className={cn(
                          "h-9 text-center tabular-nums",
                          hasRat && "border-warning bg-warning/10",
                          err?.rattrapage && "border-destructive"
                        )}
                      />
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
                          title={hasRat ? "Note retenue (max CC/Ex et rattrapage)" : ""}
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
                  <td colSpan={3} className="px-2 py-2 text-center text-xs text-muted-foreground">
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
                <td colSpan={3} className="px-2 py-3 text-center text-xs">
                  Malus absence : −{computed.malus.toFixed(2)}
                </td>
                <td className="text-center px-2 py-3 text-lg tabular-nums font-bold">
                  {computed.brute === null ? "—" : computed.brute.toFixed(2)}
                </td>
              </tr>
              <tr className="bg-primary-dark text-primary-foreground">
                <td colSpan={6} className="px-3 py-3 font-bold uppercase text-right">
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
              <span>Corrigez les notes (0–20) avant d'enregistrer.</span>
            </>
          ) : !identityComplete ? (
            <span>Renseignez le nom et le prénom de l'étudiant.</span>
          ) : computed.allComplete ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span>Saisie complète — prête à être enregistrée.</span>
            </>
          ) : (
            <span>Les notes sont enregistrées dans la base de données. Le rattrapage remplace si meilleur.</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={saving}>
            <RotateCcw className="h-4 w-4 mr-1.5" /> Réinitialiser
          </Button>
          <Button onClick={handleSave} disabled={hasErrors || saving} className="bg-primary">
            {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            {saving ? "Enregistrement…" : "Enregistrer la saisie"}
          </Button>
        </div>
      </div>
    </div>
  );
};
