import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Student, S5_SUBJECTS, S6_SUBJECTS, getDecision, getMention, getCreditsS5, getCreditsS6 } from "@/data/students";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import logo from "@/assets/logo-inptic.jpg";
import { cn } from "@/lib/utils";

interface Props {
  student: Student | null;
  view: "s5" | "s6" | "annuel";
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export const BulletinModal = ({ student, view, open, onOpenChange }: Props) => {
  if (!student) return null;

  const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 bg-background">
        <div className="no-print sticky top-0 z-10 flex items-center justify-between px-4 py-2 bg-primary text-primary-foreground">
          <span className="text-sm font-semibold">Bulletin officiel — {student.nom} {student.prenom}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => window.print()}>
              <Printer className="h-3.5 w-3.5 mr-1" /> Imprimer
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)} className="text-primary-foreground hover:bg-primary-dark">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="print-area p-8 bg-white text-[#0f172a] font-serif">
          {/* En-tête officiel */}
          <div className="grid grid-cols-3 gap-4 items-start border-b-2 border-primary pb-4 mb-6">
            <div className="text-[10px] leading-tight">
              <p className="font-bold uppercase">Institut National de la Poste,</p>
              <p className="font-bold uppercase">des Technologies de l'Information</p>
              <p className="font-bold uppercase">et de la Communication</p>
              <p className="mt-1">———————————</p>
              <p className="italic">Direction des Études</p>
              <p className="italic">et de la Pédagogie</p>
            </div>
            <div className="flex justify-center">
              <img src={logo} alt="INPTIC" className="h-24 w-24 object-contain" />
            </div>
            <div className="text-[10px] leading-tight text-right">
              <p className="font-bold uppercase">République Gabonaise</p>
              <p>———————————</p>
              <p className="italic">Union — Travail — Justice</p>
              <p>———————————</p>
              <p className="mt-2">Année universitaire</p>
              <p className="font-bold">2025 / 2026</p>
            </div>
          </div>

          {/* Titre */}
          <div className="text-center mb-5">
            <h2 className="text-2xl font-bold text-primary uppercase tracking-wide">
              {view === "s5" && "Bulletin de Notes — Semestre 5"}
              {view === "s6" && "Bulletin de Notes — Semestre 6"}
              {view === "annuel" && "Bulletin de Notes Annuel"}
            </h2>
            <p className="text-xs mt-1 italic">
              Classe : Licence Professionnelle Réseaux et Télécommunications<br />
              Option <strong>Administration et Sécurité des Réseaux (ASUR)</strong>
            </p>
          </div>

          {/* Identité étudiant */}
          <table className="w-full text-sm mb-5 border border-primary/30">
            <tbody>
              <tr className="border-b border-primary/30">
                <td className="bg-primary/10 px-3 py-1.5 font-semibold w-1/3">Nom(s) et Prénom(s)</td>
                <td className="px-3 py-1.5 font-bold">{student.nom} {student.prenom}</td>
              </tr>
              <tr className="border-b border-primary/30">
                <td className="bg-primary/10 px-3 py-1.5 font-semibold">Numéro étudiant</td>
                <td className="px-3 py-1.5 font-mono">{student.matricule}</td>
              </tr>
              <tr>
                <td className="bg-primary/10 px-3 py-1.5 font-semibold">Promotion</td>
                <td className="px-3 py-1.5">LP ASUR — 2025/2026</td>
              </tr>
            </tbody>
          </table>

          {/* Contenu : Semestre */}
          {view !== "annuel" && (
            <SemesterBulletin student={student} sem={view} />
          )}

          {view === "annuel" && (
            <AnnualBulletin student={student} />
          )}

          {/* Pied de page */}
          <div className="mt-6 grid grid-cols-2 gap-6 text-xs">
            <div>
              <p className="italic text-muted-foreground">
                Il ne sera délivré qu'un seul et unique exemplaire de bulletin de notes. L'étudiant est donc prié d'en faire plusieurs copies légalisées.
              </p>
            </div>
            <div className="text-center">
              <p>Fait à Libreville, le {today}</p>
              <p className="mt-1 font-semibold">Le Directeur des Études et de la Pédagogie</p>
              <div className="h-12 italic text-primary/60 flex items-end justify-center text-base font-serif">
                <em>Signature</em>
              </div>
              <p className="font-bold uppercase border-t border-primary/40 pt-1">Davy Edgard MOUSSAVOU</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const cellGrade = (v: number) => (
  <span className={cn("tabular-nums font-medium", v < 10 ? "text-destructive font-bold" : "")}>{v.toFixed(2)}</span>
);

const SemesterBulletin = ({ student, sem }: { student: Student; sem: "s5" | "s6" }) => {
  const subjects = sem === "s5" ? S5_SUBJECTS : S6_SUBJECTS;
  const grades = sem === "s5" ? student.s5 : student.s6;
  const ues = Array.from(new Set(subjects.map(s => s.ue)));
  const credits = sem === "s5" ? getCreditsS5(student) : getCreditsS6(student);
  const mention = getMention(grades.moyenne);

  const ueMoy = (ueName: string) => {
    const subs = subjects.filter(s => s.ue === ueName);
    const totalCoef = subs.reduce((a, b) => a + b.coef, 0);
    const sum = subs.reduce((a, b) => a + ((grades as any)[b.key] as number) * b.coef, 0);
    return sum / totalCoef;
  };

  return (
    <>
      <table className="w-full text-xs border border-primary/40 mb-4">
        <thead>
          <tr className="bg-primary text-primary-foreground">
            <th className="text-left px-2 py-1.5">Matière</th>
            <th className="px-2 py-1.5 w-16">Crédits</th>
            <th className="px-2 py-1.5 w-16">Coef.</th>
            <th className="px-2 py-1.5 w-24">Note étudiant</th>
          </tr>
        </thead>
        <tbody>
          {ues.map(ue => {
            const subs = subjects.filter(s => s.ue === ue);
            const ueLabel = ue === "UE5-1" ? "UE5-1 : ENSEIGNEMENT GÉNÉRAL"
              : ue === "UE5-2" ? "UE5-2 : CONNAISSANCES DE BASE & OUTILS RÉSEAUX D'ENTREPRISE"
              : ue === "UE6-1" ? "UE6-1 : ADMINISTRATION & SÉCURITÉ DES RÉSEAUX"
              : "UE6-2 : RAPPORT DE STAGE & SOUTENANCE";
            const totalCredits = subs.reduce((a, b) => a + b.credits, 0);
            const totalCoef = subs.reduce((a, b) => a + b.coef, 0);
            return (
              <>
                <tr key={ue} className="bg-accent/60">
                  <td colSpan={4} className="px-2 py-1.5 font-bold uppercase text-primary text-[11px]">{ueLabel}</td>
                </tr>
                {subs.map(s => {
                  const v = (grades as any)[s.key] as number;
                  return (
                    <tr key={s.key} className="border-t border-primary/15">
                      <td className="px-2 py-1">{s.label}</td>
                      <td className="text-center px-2 py-1">{s.credits}</td>
                      <td className="text-center px-2 py-1">{s.coef.toFixed(2)}</td>
                      <td className="text-center px-2 py-1">{cellGrade(v)}</td>
                    </tr>
                  );
                })}
                <tr className="bg-primary/10 border-t border-primary/30">
                  <td className="px-2 py-1 font-bold text-right">Moyenne {ue}</td>
                  <td className="text-center px-2 py-1 font-bold">{totalCredits}</td>
                  <td className="text-center px-2 py-1 font-bold">{totalCoef.toFixed(2)}</td>
                  <td className="text-center px-2 py-1 font-bold">{cellGrade(ueMoy(ue))}</td>
                </tr>
              </>
            );
          })}
          <tr className="bg-primary text-primary-foreground">
            <td colSpan={3} className="px-2 py-2 font-bold text-right uppercase">
              Moyenne du Semestre {sem === "s5" ? "5" : "6"}
            </td>
            <td className="text-center px-2 py-2 font-bold text-base tabular-nums">{grades.moyenne.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="border border-primary/40 p-2 text-xs">
          <p className="font-bold text-primary mb-1">Mention</p>
          <p className="text-base">{mention}</p>
        </div>
        <div className="border border-primary/40 p-2 text-xs">
          <p className="font-bold text-primary mb-1">Crédits acquis au semestre</p>
          <p className="text-base font-bold">{credits} / 30 ECTS</p>
        </div>
      </div>

      <div className="bg-primary/5 border-l-4 border-primary p-3 text-sm">
        <span className="font-bold uppercase text-primary">Décision du Jury : </span>
        <span className="font-bold">
          {grades.moyenne >= 10 ? `Semestre ${sem === "s5" ? "5" : "6"} validé` : `Semestre ${sem === "s5" ? "5" : "6"} non validé`}
        </span>
      </div>
    </>
  );
};

const AnnualBulletin = ({ student }: { student: Student }) => {
  const decision = getDecision(student.moyenneGenerale, student.s5.moyenne, student.s6.moyenne);
  const credits = getCreditsS5(student) + getCreditsS6(student);
  const mention = getMention(student.moyenneGenerale);

  return (
    <>
      <table className="w-full text-sm border border-primary/40 mb-4">
        <thead>
          <tr className="bg-primary text-primary-foreground">
            <th className="text-left px-3 py-2">Période</th>
            <th className="px-3 py-2">Coefficient</th>
            <th className="px-3 py-2">Moyenne</th>
            <th className="px-3 py-2">Crédits</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-primary/20">
            <td className="px-3 py-2 font-semibold">Semestre 5</td>
            <td className="text-center px-3 py-2">1</td>
            <td className="text-center px-3 py-2">{cellGrade(student.s5.moyenne)}</td>
            <td className="text-center px-3 py-2">{getCreditsS5(student)} / 30</td>
          </tr>
          <tr className="border-t border-primary/20">
            <td className="px-3 py-2 font-semibold">Semestre 6</td>
            <td className="text-center px-3 py-2">1</td>
            <td className="text-center px-3 py-2">{cellGrade(student.s6.moyenne)}</td>
            <td className="text-center px-3 py-2">{getCreditsS6(student)} / 30</td>
          </tr>
          <tr className="bg-primary/10 border-t-2 border-primary/40">
            <td className="px-3 py-2 font-bold uppercase">Moyenne Annuelle</td>
            <td className="text-center px-3 py-2 font-bold">2</td>
            <td className="text-center px-3 py-2 font-bold text-base">{cellGrade(student.moyenneGenerale)}</td>
            <td className="text-center px-3 py-2 font-bold">{credits} / 60</td>
          </tr>
        </tbody>
      </table>

      <div className="grid grid-cols-3 gap-3 mb-4 text-xs">
        <div className="border border-primary/40 p-3 text-center">
          <p className="font-bold text-primary mb-1">MENTION</p>
          <p className="text-lg font-semibold">{mention}</p>
        </div>
        <div className="border border-primary/40 p-3 text-center">
          <p className="font-bold text-primary mb-1">CRÉDITS ECTS</p>
          <p className="text-lg font-semibold">{credits} / 60</p>
        </div>
        <div className="border border-primary/40 p-3 text-center">
          <p className="font-bold text-primary mb-1">RANG</p>
          <p className="text-lg font-semibold">— / 24</p>
        </div>
      </div>

      <div className={cn(
        "border-l-4 p-4 text-sm",
        decision.type === "admis" && "bg-success/10 border-success",
        decision.type === "compensation" && "bg-warning/10 border-warning",
        decision.type === "refuse" && "bg-destructive/10 border-destructive",
      )}>
        <p className="font-bold uppercase text-primary mb-1">Décision du Conseil d'Établissement</p>
        <p className="text-lg font-bold">
          {decision.label}
          {decision.type === "admis" && " — Diplôme de Licence Professionnelle ASUR délivré"}
          {decision.type === "compensation" && " — Diplôme délivré (compensation S5/S6)"}
          {decision.type === "refuse" && " — Redoublement requis"}
        </p>
      </div>
    </>
  );
};
