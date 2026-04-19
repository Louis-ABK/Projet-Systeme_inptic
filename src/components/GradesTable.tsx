import { Student, S5_SUBJECTS, S6_SUBJECTS, getDecision, getMention, getCreditsS5, getCreditsS6 } from "@/data/students";
import { Grade } from "./Grade";
import { Button } from "./ui/button";
import { FileText } from "lucide-react";
import { Card } from "./ui/card";
import { cn } from "@/lib/utils";

interface Props {
  students: Student[];
  view: "s5" | "s6" | "annuel";
  onShowBulletin: (s: Student) => void;
}

export const GradesTable = ({ students, view, onShowBulletin }: Props) => {
  if (view === "annuel") {
    return (
      <Card className="overflow-hidden shadow-elegant border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-header text-primary-foreground">
                <th className="text-left px-4 py-3 font-semibold sticky left-0 bg-primary">Matricule</th>
                <th className="text-left px-4 py-3 font-semibold">Nom & Prénom</th>
                <th className="text-center px-3 py-3 font-semibold">Moyenne S5</th>
                <th className="text-center px-3 py-3 font-semibold">Moyenne S6</th>
                <th className="text-center px-3 py-3 font-semibold">Moy. Générale</th>
                <th className="text-center px-3 py-3 font-semibold">Crédits ECTS</th>
                <th className="text-center px-3 py-3 font-semibold">Mention</th>
                <th className="text-center px-3 py-3 font-semibold">Décision du Jury</th>
                <th className="text-center px-3 py-3 font-semibold">Bulletin</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => {
                const decision = getDecision(s.moyenneGenerale, s.s5.moyenne, s.s6.moyenne);
                const credits = getCreditsS5(s) + getCreditsS6(s);
                const mention = getMention(s.moyenneGenerale);
                return (
                  <tr key={s.matricule} className={cn(i % 2 === 0 ? "bg-card" : "bg-muted/40", "hover:bg-accent/50 transition-colors")}>
                    <td className="px-4 py-2.5 font-mono text-xs font-semibold text-primary">{s.matricule}</td>
                    <td className="px-4 py-2.5">
                      <div className="font-semibold">{s.nom}</div>
                      <div className="text-xs text-muted-foreground">{s.prenom}</div>
                    </td>
                    <td className="text-center px-3 py-2.5"><Grade value={s.s5.moyenne} /></td>
                    <td className="text-center px-3 py-2.5"><Grade value={s.s6.moyenne} /></td>
                    <td className="text-center px-3 py-2.5">
                      <span className={cn("inline-block px-2 py-0.5 rounded-md font-bold tabular-nums",
                        s.moyenneGenerale >= 10 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
                        {s.moyenneGenerale.toFixed(2)}
                      </span>
                    </td>
                    <td className="text-center px-3 py-2.5 font-semibold tabular-nums">{credits} / 60</td>
                    <td className="text-center px-3 py-2.5 text-xs">{mention}</td>
                    <td className="text-center px-3 py-2.5">
                      <span className={cn("inline-block px-2.5 py-1 rounded-full text-xs font-semibold",
                        decision.type === "admis" && "bg-success/15 text-success",
                        decision.type === "compensation" && "bg-warning/15 text-warning",
                        decision.type === "refuse" && "bg-destructive/15 text-destructive",
                      )}>
                        {decision.label}
                      </span>
                    </td>
                    <td className="text-center px-3 py-2.5">
                      <Button size="sm" variant="outline" onClick={() => onShowBulletin(s)} className="h-8">
                        <FileText className="h-3.5 w-3.5 mr-1" /> Voir
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    );
  }

  const subjects = view === "s5" ? S5_SUBJECTS : S6_SUBJECTS;
  const moyKey = view === "s5" ? "Moyenne S5" : "Moyenne S6";

  return (
    <Card className="overflow-hidden shadow-elegant border-border/50">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gradient-header text-primary-foreground">
              <th className="text-left px-3 py-3 font-semibold sticky left-0 bg-primary z-10 min-w-[180px]">Étudiant</th>
              {subjects.map((sub) => (
                <th key={sub.key} className="text-center px-2 py-3 font-medium whitespace-nowrap" title={sub.label}>
                  <div className="text-[10px] opacity-70">{sub.ue}</div>
                  <div className="max-w-[90px] mx-auto leading-tight">{shortLabel(sub.label)}</div>
                </th>
              ))}
              <th className="text-center px-3 py-3 font-bold bg-primary-dark">{moyKey}</th>
              <th className="text-center px-3 py-3 font-semibold">Bulletin</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, i) => {
              const grades = view === "s5" ? s.s5 : s.s6;
              const moy = grades.moyenne;
              return (
                <tr key={s.matricule} className={cn(i % 2 === 0 ? "bg-card" : "bg-muted/40", "hover:bg-accent/40 transition-colors")}>
                  <td className="px-3 py-2.5 sticky left-0 bg-inherit z-10 border-r border-border/40">
                    <div className="font-semibold text-sm">{s.nom} {s.prenom}</div>
                    <div className="text-[10px] font-mono text-primary">{s.matricule}</div>
                  </td>
                  {subjects.map((sub) => {
                    const v = (grades as any)[sub.key] as number;
                    return (
                      <td key={sub.key} className="text-center px-2 py-2.5">
                        <Grade value={v} />
                      </td>
                    );
                  })}
                  <td className="text-center px-3 py-2.5 bg-accent/30">
                    <span className={cn("inline-block px-2 py-0.5 rounded font-bold tabular-nums text-sm",
                      moy >= 10 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
                      {moy.toFixed(2)}
                    </span>
                  </td>
                  <td className="text-center px-2 py-2.5">
                    <Button size="sm" variant="outline" onClick={() => onShowBulletin(s)} className="h-7 text-xs">
                      <FileText className="h-3 w-3 mr-1" /> Voir
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

function shortLabel(s: string) {
  const map: Record<string, string> = {
    "Anglais technique": "Anglais",
    "Management d'équipe": "Management",
    "Communication": "Comm.",
    "Droit de l'informatique": "Droit info.",
    "Gestion de projets": "Gest. Projets",
    "Veille technologique": "Veille",
    "Consolidation des bases de la programmation": "Programmation",
    "Conception BDD et langage SQL": "BDD/SQL",
    "Remise à niveau IOS": "IOS",
    "Connaissance des réseaux LAN": "Réseaux LAN",
    "Les langages du script": "Scripts",
    "Virtualisation": "Virtualisation",
    "Application client-serveur": "Client/Serv.",
    "Téléphonie IP avancée": "Téléphonie IP",
    "Services à valeur ajoutée": "SVA",
    "Environnement Windows": "Windows",
    "Environnement Linux": "Linux",
    "Interopérabilité": "Interop.",
    "Cryptage et Authentification": "Crypto/Auth",
    "Prévention et Sécurité": "Prévention",
    "Contrôle d'accès distant": "Accès Distant",
    "CCNA3": "CCNA3",
    "Méthodologie de rédaction du rapport de stage": "Rapport Stage",
    "Soutenance": "Soutenance",
  };
  return map[s] || s;
}

import { cn } from "@/lib/utils";
