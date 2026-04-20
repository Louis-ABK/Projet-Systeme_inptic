import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Student,
  S5_SUBJECTS,
  S6_SUBJECTS,
  STUDENTS,
  getDecision,
  getMention,
  getCreditsS5,
  getCreditsS6,
} from "@/data/students";
import { Button } from "@/components/ui/button";
import { Printer, X, Download } from "lucide-react";
import logo from "@/assets/logo-inptic.jpg";
import { cn } from "@/lib/utils";
import { useMemo, useRef } from "react";
import { exportBulletinToPDF } from "@/lib/pdf-export";
import { printElement } from "@/lib/print-bulletin";
import { loadIdentity } from "@/lib/identity-store";
import { useToast } from "@/hooks/use-toast";

interface Props {
  student: Student | null;
  view: "s5" | "s6" | "annuel";
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

// Pré-calcul des moyennes de classe par matière
const classAverages = {
  s5: Object.fromEntries(
    S5_SUBJECTS.map((s) => [
      s.key,
      STUDENTS.reduce((a, st) => a + (st.s5 as any)[s.key], 0) / STUDENTS.length,
    ])
  ) as Record<string, number>,
  s6: Object.fromEntries(
    S6_SUBJECTS.map((s) => [
      s.key,
      STUDENTS.reduce((a, st) => a + (st.s6 as any)[s.key], 0) / STUDENTS.length,
    ])
  ) as Record<string, number>,
  s5Moy: STUDENTS.reduce((a, s) => a + s.s5.moyenne, 0) / STUDENTS.length,
  s6Moy: STUDENTS.reduce((a, s) => a + s.s6.moyenne, 0) / STUDENTS.length,
  annuel: STUDENTS.reduce((a, s) => a + s.moyenneGenerale, 0) / STUDENTS.length,
};

// Stats min / max / écart-type (§5.5 du cahier des charges)
const computePromoStats = (values: number[]) => {
  const n = values.length || 1;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance);
  return { min, max, mean, std };
};
const promoStats = {
  s5: computePromoStats(STUDENTS.map((s) => s.s5.moyenne)),
  s6: computePromoStats(STUDENTS.map((s) => s.s6.moyenne)),
  annuel: computePromoStats(STUDENTS.map((s) => s.moyenneGenerale)),
};

export const BulletinModal = ({ student, view, open, onOpenChange }: Props) => {
  const today = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Identité lue depuis le store partagé (alimenté par l'écran Saisie des notes)
  const identity = student ? loadIdentity(student.matricule) : {};

  const rank = useMemo(() => {
    if (!student) return 0;
    const sorted = [...STUDENTS].sort((a, b) => {
      if (view === "s5") return b.s5.moyenne - a.s5.moyenne;
      if (view === "s6") return b.s6.moyenne - a.s6.moyenne;
      return b.moyenneGenerale - a.moyenneGenerale;
    });
    return sorted.findIndex((s) => s.matricule === student.matricule) + 1;
  }, [student, view]);

  if (!student) return null;

  const handlePrint = () => {
    if (!printRef.current) return;
    const viewLabel = view === "s5" ? "Semestre 5" : view === "s6" ? "Semestre 6" : "Annuel";
    printElement(
      printRef.current,
      `Bulletin ${viewLabel} — ${student?.nom ?? ""} ${student?.prenom ?? ""}`
    );
  };

  const handleExportPDF = async () => {
    if (!printRef.current) return;
    try {
      toast({ title: "Génération du PDF…", description: "Veuillez patienter" });
      const viewLabel = view === "s5" ? "S5" : view === "s6" ? "S6" : "Annuel";
      const filename = `Bulletin_${viewLabel}_${student?.nom}_${student?.prenom}.pdf`;
      await exportBulletinToPDF(printRef.current, filename);
      toast({ title: "PDF téléchargé", description: filename });
    } catch (e) {
      toast({
        title: "Erreur PDF",
        description: "Impossible de générer le PDF.",
        variant: "destructive",
      });
    }
  };

  const titleLabel =
    view === "s5"
      ? "Bulletin de notes du Semestre 5"
      : view === "s6"
      ? "Bulletin de Notes du Semestre 6"
      : "Bulletin de notes Annuel";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[860px] max-h-[94vh] overflow-y-auto p-0 bg-background">
        {/* Barre d'actions (cachée à l'impression) */}
        <div className="no-print sticky top-0 z-20 flex items-center justify-between px-4 py-2 bg-primary text-primary-foreground border-b border-primary-dark">
          <span className="text-sm font-semibold truncate">
            {titleLabel} — {student.nom} {student.prenom}
          </span>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" variant="secondary" onClick={handlePrint}>
              <Printer className="h-3.5 w-3.5 mr-1.5" /> Imprimer
            </Button>
            <Button size="sm" variant="secondary" onClick={handleExportPDF}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> PDF
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-primary-foreground hover:bg-primary-dark"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* DOCUMENT IMPRIMABLE — A4 */}
        <div
          ref={printRef}
          className="print-area bg-white text-black px-10 py-8"
          style={{ fontFamily: "'Times New Roman', Times, serif" }}
        >
          {/* En-tête tripartite officiel */}
          <div className="grid grid-cols-3 gap-3 items-start mb-3">
            <div className="text-[10px] leading-snug">
              <p className="font-bold uppercase">Institut National de la Poste,</p>
              <p className="font-bold uppercase">des Technologies de l'Information</p>
              <p className="font-bold uppercase">et de la Communication</p>
              <p className="my-1 tracking-widest">———————————</p>
              <p className="font-semibold uppercase text-[9.5px]">Direction des Études</p>
              <p className="font-semibold uppercase text-[9.5px]">et de la Pédagogie</p>
            </div>
            <div className="flex justify-center">
              <img src={logo} alt="INPTIC" className="h-[88px] w-[88px] object-contain" />
            </div>
            <div className="text-[10px] leading-snug text-center">
              <p className="font-bold uppercase">République Gabonaise</p>
              <p className="my-1 tracking-widest">———————————</p>
              <p className="italic">Union — Travail — Justice</p>
              <p className="my-1 tracking-widest">———————————</p>
            </div>
          </div>

          {/* Titre */}
          <div className="text-center my-5">
            <h1 className="text-[20px] font-bold underline underline-offset-4 decoration-2">
              {titleLabel}
            </h1>
            <p className="text-[12px] mt-1.5">
              Année universitaire : <strong>2025 / 2026</strong>
            </p>
          </div>

          {/* Classe */}
          <p className="text-[12px] mb-3">
            <strong>Classe :</strong> Licence Professionnelle Réseaux et Télécommunications{" "}
            <strong>Option Administration et Sécurité des Réseaux (ASUR)</strong>
          </p>

          {/* Identité étudiant */}
          <table className="w-full text-[12px] mb-4 border-collapse">
            <tbody>
              <tr>
                <td className="border border-black px-2 py-1.5 font-bold w-[35%] bg-[#f0f0f0]">
                  Nom(s) et Prénom(s)
                </td>
                <td className="border border-black px-2 py-1.5 font-bold">
                  {student.nom} {student.prenom}
                </td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1.5 bg-[#f0f0f0]">
                  Date et lieu de naissance
                </td>
                <td className="border border-black px-2 py-1.5">
                  {identity.dateNaissance || identity.lieuNaissance ? (
                    <>
                      Né(e) le{" "}
                      {identity.dateNaissance
                        ? new Date(identity.dateNaissance).toLocaleDateString("fr-FR")
                        : "…"}{" "}
                      à {identity.lieuNaissance || "…"}
                    </>
                  ) : (
                    <span className="italic text-gray-500">
                      Né(e) le ……………………… à ………………………
                    </span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1.5 bg-[#f0f0f0]">
                  Type de baccalauréat
                </td>
                <td className="border border-black px-2 py-1.5">
                  {identity.bac || (
                    <span className="italic text-gray-500">
                      ………………………………………………………
                    </span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1.5 bg-[#f0f0f0]">
                  Établissement d'origine
                </td>
                <td className="border border-black px-2 py-1.5">
                  {identity.etablissement || (
                    <span className="italic text-gray-500">
                      ………………………………………………………
                    </span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1.5 bg-[#f0f0f0]">
                  Numéro étudiant (matricule)
                </td>
                <td className="border border-black px-2 py-1.5 font-mono">
                  {student.matricule}
                </td>
              </tr>
            </tbody>
          </table>

          {view === "s5" && <SemesterBulletin student={student} sem="s5" rank={rank} />}
          {view === "s6" && <SemesterBulletin student={student} sem="s6" rank={rank} />}
          {view === "annuel" && <AnnualBulletin student={student} rank={rank} />}

          {/* Statistiques de la promotion (§5.5 du cahier des charges) */}
          <table className="w-full text-[10.5px] border-collapse mt-3 mb-2">
            <thead>
              <tr className="bg-[#e8e8e8]">
                <th className="border border-black px-2 py-1 font-bold" colSpan={4}>
                  Statistiques de la promotion ({STUDENTS.length} étudiants)
                </th>
              </tr>
              <tr className="bg-[#f5f5f5]">
                <th className="border border-black px-2 py-1 font-semibold">Moyenne classe</th>
                <th className="border border-black px-2 py-1 font-semibold">Min</th>
                <th className="border border-black px-2 py-1 font-semibold">Max</th>
                <th className="border border-black px-2 py-1 font-semibold">Écart-type</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                {(() => {
                  const stats =
                    view === "s5"
                      ? promoStats.s5
                      : view === "s6"
                      ? promoStats.s6
                      : promoStats.annuel;
                  return (
                    <>
                      <td className="border border-black px-2 py-1 text-center font-semibold">
                        {stats.mean.toFixed(2).replace(".", ",")}
                      </td>
                      <td className="border border-black px-2 py-1 text-center">
                        {stats.min.toFixed(2).replace(".", ",")}
                      </td>
                      <td className="border border-black px-2 py-1 text-center">
                        {stats.max.toFixed(2).replace(".", ",")}
                      </td>
                      <td className="border border-black px-2 py-1 text-center">
                        {stats.std.toFixed(2).replace(".", ",")}
                      </td>
                    </>
                  );
                })()}
              </tr>
            </tbody>
          </table>

          {/* Pied de page officiel */}
          <div className="mt-6 grid grid-cols-2 gap-6">
            <div className="text-[10px] italic leading-snug pt-4">
              Il ne sera délivré qu'un seul et unique exemplaire de bulletin de notes.
              L'étudiant est donc prié d'en faire plusieurs copies légalisées.
            </div>
            <div className="text-[11px] text-center">
              <p>Fait à Libreville, le {today}</p>
              <p className="mt-1 font-semibold uppercase">
                Le Directeur des Études et de la Pédagogie
              </p>
              <div className="h-12" />
              <p className="font-bold">Davy Edgard MOUSSAVOU</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Note = ({ v, bold = false }: { v: number; bold?: boolean }) => (
  <span className={cn("tabular-nums", bold && "font-bold", v < 10 && "text-[#c00] font-bold")}>
    {v.toFixed(2).replace(".", ",")}
  </span>
);

const SemesterBulletin = ({
  student,
  sem,
  rank,
}: {
  student: Student;
  sem: "s5" | "s6";
  rank: number;
}) => {
  const subjects = sem === "s5" ? S5_SUBJECTS : S6_SUBJECTS;
  const grades = sem === "s5" ? student.s5 : student.s6;
  const ues = Array.from(new Set(subjects.map((s) => s.ue)));
  const mention = getMention(grades.moyenne);
  const classMoy = sem === "s5" ? classAverages.s5Moy : classAverages.s6Moy;
  const avgs = sem === "s5" ? classAverages.s5 : classAverages.s6;

  const ueMoy = (ueName: string) => {
    const subs = subjects.filter((s) => s.ue === ueName);
    const totalCoef = subs.reduce((a, b) => a + b.coef, 0);
    const sum = subs.reduce((a, b) => a + ((grades as any)[b.key] as number) * b.coef, 0);
    return sum / totalCoef;
  };
  const ueClassMoy = (ueName: string) => {
    const subs = subjects.filter((s) => s.ue === ueName);
    const totalCoef = subs.reduce((a, b) => a + b.coef, 0);
    const sum = subs.reduce((a, b) => a + (avgs[b.key] as number) * b.coef, 0);
    return sum / totalCoef;
  };

  const totalCoefAll = subjects.reduce((a, b) => a + b.coef, 0);

  const creditsForUE = (ueName: string) => {
    const subs = subjects.filter((s) => s.ue === ueName);
    return subs.filter((s) => (grades as any)[s.key] >= 10).reduce((a, b) => a + b.credits, 0);
  };
  const ueData = ues.map((ue) => {
    const subs = subjects.filter((s) => s.ue === ue);
    const totalC = subs.reduce((a, b) => a + b.credits, 0);
    const m = ueMoy(ue);
    return {
      name: ue,
      total: totalC,
      acquired: m >= 10 ? totalC : creditsForUE(ue),
      compensation: m >= 10,
    };
  });
  const totalCreditsAcquired = ueData.reduce((a, u) => a + u.acquired, 0);
  const totalCreditsMax = ueData.reduce((a, u) => a + u.total, 0);

  const ueLabels: Record<string, string> = {
    "UE5-1": "UE5-1 : ENSEIGNEMENT GENERAL",
    "UE5-2": "UE5-2 : CONNAISSANCES DE BASE ET OUTILS POUR LES RESEAUX D'ENTREPRISE",
    "UE6-1": "UE 6-1 : Sciences de Base",
    "UE6-2": "UE6-2 : Télécommunications et Réseaux",
  };

  return (
    <>
      <table className="w-full text-[11px] border-collapse mb-3">
        <thead>
          <tr className="bg-[#e8e8e8]">
            <th className="border border-black px-2 py-1.5 text-left font-bold w-[42%]"></th>
            <th className="border border-black px-1 py-1.5 font-bold w-[10%]">Crédits</th>
            <th className="border border-black px-1 py-1.5 font-bold w-[12%]">Coefficients</th>
            <th className="border border-black px-1 py-1.5 font-bold w-[18%]">Notes de l'étudiant</th>
            <th className="border border-black px-1 py-1.5 font-bold w-[18%]">Moyenne de classe</th>
          </tr>
        </thead>
        <tbody>
          {ues.map((ue) => {
            const subs = subjects.filter((s) => s.ue === ue);
            const totalCredits = subs.reduce((a, b) => a + b.credits, 0);
            const totalCoef = subs.reduce((a, b) => a + b.coef, 0);
            return (
              <>
                <tr key={ue} className="bg-[#d6e4f0]">
                  <td colSpan={5} className="border border-black px-2 py-1 font-bold uppercase">
                    {ueLabels[ue]}
                  </td>
                </tr>
                {subs.map((s) => {
                  const v = (grades as any)[s.key] as number;
                  return (
                    <tr key={s.key}>
                      <td className="border border-black px-2 py-1">{s.label}</td>
                      <td className="border border-black px-1 py-1 text-center">{s.credits}</td>
                      <td className="border border-black px-1 py-1 text-center">
                        {s.coef.toFixed(2).replace(".", ",")}
                      </td>
                      <td className="border border-black px-1 py-1 text-center">
                        <Note v={v} />
                      </td>
                      <td className="border border-black px-1 py-1 text-center">
                        <Note v={avgs[s.key]} />
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-[#f5f5f5]">
                  <td className="border border-black px-2 py-1 font-bold">Moyenne {ue}</td>
                  <td className="border border-black px-1 py-1 text-center font-bold">{totalCredits}</td>
                  <td className="border border-black px-1 py-1 text-center font-bold">
                    {totalCoef.toFixed(2).replace(".", ",")}
                  </td>
                  <td className="border border-black px-1 py-1 text-center">
                    <Note v={ueMoy(ue)} bold />
                  </td>
                  <td className="border border-black px-1 py-1 text-center">
                    <Note v={ueClassMoy(ue)} bold />
                  </td>
                </tr>
              </>
            );
          })}
          <tr>
            <td className="border border-black px-2 py-1 text-right font-semibold" colSpan={2}>
              Total coefficients
            </td>
            <td className="border border-black px-1 py-1 text-center font-bold">
              {totalCoefAll.toFixed(2).replace(".", ",")}
            </td>
            <td className="border border-black px-1 py-1"></td>
            <td className="border border-black px-1 py-1"></td>
          </tr>
          <tr>
            <td className="border border-black px-2 py-1" colSpan={2}>
              Pénalités d'absences
            </td>
            <td className="border border-black px-1 py-1 text-center bg-[#fff3cd]">0,01/heure</td>
            <td className="border border-black px-1 py-1 text-center">0 heure(s)</td>
            <td className="border border-black px-1 py-1"></td>
          </tr>
          <tr className="bg-[#fff3cd]">
            <td className="border border-black px-2 py-1.5 text-center font-bold uppercase" colSpan={3}>
              Moyenne Semestre {sem === "s5" ? "5" : "6"}
            </td>
            <td className="border border-black px-1 py-1.5 text-center text-[13px]">
              <Note v={grades.moyenne} bold />
            </td>
            <td className="border border-black px-1 py-1.5 text-center text-[13px]">
              <Note v={classMoy} bold />
            </td>
          </tr>
        </tbody>
      </table>

      <table className="w-full text-[11px] border-collapse mb-3">
        <tbody>
          <tr className="bg-[#e8e8e8]">
            <th className="border border-black px-2 py-1 font-bold w-1/2">
              Rang de l'étudiant au Semestre
            </th>
            <th className="border border-black px-2 py-1 font-bold w-1/2">Mention</th>
          </tr>
          <tr>
            <td className="border border-black px-2 py-1.5 text-center">
              {rank}
              <sup>ème</sup> / {STUDENTS.length}
            </td>
            <td className="border border-black px-2 py-1.5 text-center font-semibold">{mention}</td>
          </tr>
        </tbody>
      </table>

      <table className="w-full text-[11px] border-collapse mb-3">
        <thead>
          <tr className="bg-[#d6e4f0]">
            <th colSpan={ueData.length + 1} className="border border-black px-2 py-1.5 font-bold">
              État de la Validation des Crédits au Semestre {sem === "s5" ? "5" : "6"}
            </th>
          </tr>
          <tr className="bg-[#e8e8e8]">
            {ueData.map((u) => (
              <th key={u.name} className="border border-black px-2 py-1 font-bold">
                {u.name}
              </th>
            ))}
            <th className="border border-black px-2 py-1 font-bold">
              Crédits validés au Semestre {sem === "s5" ? "5" : "6"}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            {ueData.map((u) => (
              <td key={u.name} className="border border-black px-2 py-1.5 text-center font-semibold">
                {u.acquired} Crédits / {u.total}
              </td>
            ))}
            <td className="border border-black px-2 py-1.5 text-center font-bold">
              {totalCreditsAcquired} Crédits / {totalCreditsMax}
            </td>
          </tr>
          <tr>
            {ueData.map((u) => (
              <td key={u.name} className="border border-black px-2 py-1 text-center text-[10px] italic">
                {u.acquired === u.total
                  ? "UE Acquise"
                  : u.compensation
                  ? "UE Acquise par Compensation"
                  : "UE non Acquise"}
              </td>
            ))}
            <td className="border border-black px-2 py-1 text-center text-[10px] italic font-semibold">
              {grades.moyenne >= 10
                ? totalCreditsAcquired === totalCreditsMax
                  ? "Semestre Acquis"
                  : "Semestre Acquis par Compensation"
                : "Semestre non Acquis"}
            </td>
          </tr>
        </tbody>
      </table>

      <p className="text-[12px] mt-3">
        <strong>Décision du Jury : </strong>
        <strong className="underline">
          {grades.moyenne >= 10
            ? `Semestre ${sem === "s5" ? "5" : "6"} validé`
            : `Semestre ${sem === "s5" ? "5" : "6"} non validé`}
        </strong>
      </p>
    </>
  );
};

const AnnualBulletin = ({ student, rank }: { student: Student; rank: number }) => {
  const decision = getDecision(student.moyenneGenerale, student.s5.moyenne, student.s6.moyenne);
  const credS5 = getCreditsS5(student);
  const credS6 = getCreditsS6(student);
  const credits = credS5 + credS6;
  const mention = getMention(student.moyenneGenerale);

  return (
    <>
      <table className="w-full text-[11px] border-collapse mb-3">
        <thead>
          <tr className="bg-[#e8e8e8]">
            <th className="border border-black px-2 py-1.5 text-left font-bold w-[40%]">Période</th>
            <th className="border border-black px-1 py-1.5 font-bold">Coefficient</th>
            <th className="border border-black px-1 py-1.5 font-bold">Moyenne</th>
            <th className="border border-black px-1 py-1.5 font-bold">Crédits ECTS</th>
            <th className="border border-black px-1 py-1.5 font-bold">Moyenne de classe</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black px-2 py-1.5 font-semibold">Semestre 5</td>
            <td className="border border-black px-1 py-1.5 text-center">1,00</td>
            <td className="border border-black px-1 py-1.5 text-center">
              <Note v={student.s5.moyenne} />
            </td>
            <td className="border border-black px-1 py-1.5 text-center">{credS5} / 30</td>
            <td className="border border-black px-1 py-1.5 text-center">
              <Note v={classAverages.s5Moy} />
            </td>
          </tr>
          <tr>
            <td className="border border-black px-2 py-1.5 font-semibold">Semestre 6</td>
            <td className="border border-black px-1 py-1.5 text-center">1,00</td>
            <td className="border border-black px-1 py-1.5 text-center">
              <Note v={student.s6.moyenne} />
            </td>
            <td className="border border-black px-1 py-1.5 text-center">{credS6} / 30</td>
            <td className="border border-black px-1 py-1.5 text-center">
              <Note v={classAverages.s6Moy} />
            </td>
          </tr>
          <tr className="bg-[#fff3cd]">
            <td className="border border-black px-2 py-1.5 font-bold uppercase">Moyenne Annuelle</td>
            <td className="border border-black px-1 py-1.5 text-center font-bold">2,00</td>
            <td className="border border-black px-1 py-1.5 text-center text-[13px]">
              <Note v={student.moyenneGenerale} bold />
            </td>
            <td className="border border-black px-1 py-1.5 text-center font-bold">
              {credits} / 60
            </td>
            <td className="border border-black px-1 py-1.5 text-center">
              <Note v={classAverages.annuel} bold />
            </td>
          </tr>
        </tbody>
      </table>

      <table className="w-full text-[11px] border-collapse mb-3">
        <tbody>
          <tr className="bg-[#e8e8e8]">
            <th className="border border-black px-2 py-1 font-bold w-1/2">
              Rang de l'étudiant à l'année
            </th>
            <th className="border border-black px-2 py-1 font-bold w-1/2">Mention</th>
          </tr>
          <tr>
            <td className="border border-black px-2 py-1.5 text-center">
              {rank}
              <sup>ème</sup> / {STUDENTS.length}
            </td>
            <td className="border border-black px-2 py-1.5 text-center font-semibold">{mention}</td>
          </tr>
        </tbody>
      </table>

      <table className="w-full text-[11px] border-collapse mb-3">
        <thead>
          <tr className="bg-[#d6e4f0]">
            <th colSpan={3} className="border border-black px-2 py-1.5 font-bold">
              Bilan de l'année universitaire
            </th>
          </tr>
          <tr className="bg-[#e8e8e8]">
            <th className="border border-black px-2 py-1 font-bold">Crédits Semestre 5</th>
            <th className="border border-black px-2 py-1 font-bold">Crédits Semestre 6</th>
            <th className="border border-black px-2 py-1 font-bold">Crédits Acquis sur l'Année</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black px-2 py-1.5 text-center font-semibold">{credS5} / 30</td>
            <td className="border border-black px-2 py-1.5 text-center font-semibold">{credS6} / 30</td>
            <td className="border border-black px-2 py-1.5 text-center font-bold">{credits} / 60</td>
          </tr>
        </tbody>
      </table>

      <p className="text-[12px] mt-3">
        <strong>Décision du Conseil d'Établissement : </strong>
        <strong className="underline">
          {decision.label}
          {decision.type === "admis" && " — Diplôme de Licence Professionnelle ASUR délivré"}
          {decision.type === "compensation" && " — Diplôme délivré par compensation S5/S6"}
          {decision.type === "refuse" && " — Redoublement requis"}
        </strong>
      </p>
      <p className="text-[12px] mt-1">
        <strong>Mention : </strong>
        <strong>{mention}</strong>
      </p>
    </>
  );
};
