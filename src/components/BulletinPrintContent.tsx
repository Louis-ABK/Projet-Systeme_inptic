import {
  Student,
  getDecision,
  getMention,
  getCreditsS5,
  getCreditsS6,
} from "@/data/students";
import { getSubjects, ClasseKey, getSemesterLabels } from "@/data/referentiel";
import logo from "@/assets/logo-inptic.jpg";
import { cn } from "@/lib/utils";
import React, { useMemo } from "react";
import { loadIdentity } from "@/lib/identity-store";

interface Props {
  student: Student;
  view: "s5" | "s6" | "annuel";
  students: Student[];
}

const computePromoStats = (values: number[]) => {
  const n = values.length || 1;
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance);
  return { min, max, mean, std };
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
  classData,
}: {
  student: Student;
  sem: "s5" | "s6";
  rank: number;
  classData: any;
}) => {
  const subjects = getSubjects(student.classeKey as ClasseKey, sem);
  const grades = sem === "s5" ? student.s5 : student.s6;
  const ues = Array.from(new Set(subjects.map((s) => s.ue)));
  const mention = getMention(grades.moyenne);
  const classMoy = sem === "s5" ? classData.s5Moy : classData.s6Moy;
  const avgs = sem === "s5" ? classData.s5 : classData.s6;
  const totalStudents = classData.total;

  const ueMoy = (ueName: string) => {
    const subs = subjects.filter((s) => s.ue === ueName);
    const totalCoef = subs.reduce((a, b) => a + b.coef, 0);
    const sum = subs.reduce((a, b) => a + ((grades as any)[b.key] as number) * b.coef, 0);
    return totalCoef ? sum / totalCoef : 0;
  };
  const ueClassMoy = (ueName: string) => {
    const subs = subjects.filter((s) => s.ue === ueName);
    const totalCoef = subs.reduce((a, b) => a + b.coef, 0);
    const sum = subs.reduce((a, b) => a + (avgs[b.key] as number) * b.coef, 0);
    return totalCoef ? sum / totalCoef : 0;
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
    const semMoy = grades.moyenne || 0;
    // UE acquise si moyUE >= 10 ; compensée si moy < 10 mais semestre >= 10
    const ueAcquise = m >= 10;
    const ueCompensee = !ueAcquise && semMoy >= 10;
    return {
      name: ue,
      total: totalC,
      acquired: (ueAcquise || ueCompensee) ? totalC : creditsForUE(ue),
      ueAcquise,
      ueCompensee,
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

  const niveau = student.classeKey?.split('-')[1];
  const [labelS5, labelS6] = getSemesterLabels(niveau);
  const semLabel = sem === "s5" ? labelS5 : labelS6;

  return (
    <>
      <table className="w-full text-[9px] leading-[11px] border-collapse mb-1">
        <thead>
          <tr className="bg-[#e8e8e8]">
            <th className="border border-black px-1.5 py-0 text-left font-bold w-[42%]"></th>
            <th className="border border-black px-1 py-0 font-bold w-[10%]">Crédits</th>
            <th className="border border-black px-1 py-0 font-bold w-[12%]">Coefficients</th>
            <th className="border border-black px-1 py-0 font-bold w-[18%]">Notes de l'étudiant</th>
            <th className="border border-black px-1 py-0 font-bold w-[18%]">Moyenne de classe</th>
          </tr>
        </thead>
        <tbody>
          {ues.map((ue) => {
            const subs = subjects.filter((s) => s.ue === ue);
            const totalCredits = subs.reduce((a, b) => a + b.credits, 0);
            const totalCoef = subs.reduce((a, b) => a + b.coef, 0);
            return (
              <React.Fragment key={ue}>
                <tr className="bg-[#d6e4f0]">
                  <td colSpan={5} className="border border-black px-2 py-1 font-bold uppercase text-[11px]">
                    {ueLabels[ue] || ue}
                  </td>
                </tr>
                {subs.map((s) => {
                  const v = (grades as any)[s.key] as number;
                  return (
                    <tr key={s.key}>
                      <td className="border border-black px-2 py-1 text-left">{s.label}</td>
                      <td className="border border-black px-1 py-1 text-center">{s.credits}</td>
                      <td className="border border-black px-1 py-1 text-center">
                        {s.coef.toFixed(2).replace(".", ",")}
                      </td>
                      <td className="border border-black px-1 py-1 text-center">
                        <Note v={v || 0} />
                      </td>
                      <td className="border border-black px-1 py-1 text-center">
                        <Note v={avgs[s.key] || 0} />
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-[#f5f5f5]">
                  <td className="border border-black px-1.5 py-0 font-bold">Moyenne {ue}</td>
                  <td className="border border-black px-1 py-0 text-center font-bold">{totalCredits}</td>
                  <td className="border border-black px-1 py-0 text-center font-bold">
                    {totalCoef.toFixed(2).replace(".", ",")}
                  </td>
                  <td className="border border-black px-1 py-0 text-center">
                    <Note v={ueMoy(ue)} bold />
                  </td>
                  <td className="border border-black px-1 py-0 text-center">
                    <Note v={ueClassMoy(ue)} bold />
                  </td>
                </tr>
              </React.Fragment>
            );
          })}
          <tr>
            <td className="border border-black px-1.5 py-0 text-right font-semibold" colSpan={2}>
              Total coefficients
            </td>
            <td className="border border-black px-1 py-0 text-center font-bold">
              {totalCoefAll.toFixed(2).replace(".", ",")}
            </td>
            <td className="border border-black px-1 py-0"></td>
            <td className="border border-black px-1 py-0"></td>
          </tr>
          <tr>
            <td className="border border-black px-1.5 py-0" colSpan={2}>
              Pénalités d'absences
            </td>
            <td className="border border-black px-1 py-0 text-center bg-[#fff3cd]">0,01/heure</td>
            <td className="border border-black px-1 py-0 text-center">0 heure(s)</td>
            <td className="border border-black px-1 py-0"></td>
          </tr>
          <tr className="bg-[#fff3cd]">
            <td className="border border-black px-1.5 py-0 text-center font-bold uppercase" colSpan={3}>
              Moyenne {semLabel}
            </td>
            <td className="border border-black px-1 py-0 text-center text-[10px]">
              <Note v={grades.moyenne || 0} bold />
            </td>
            <td className="border border-black px-1 py-0 text-center text-[10px]">
              <Note v={classMoy || 0} bold />
            </td>
          </tr>
        </tbody>
      </table>

      <table className="w-full text-[9px] leading-[11px] border-collapse mb-1">
        <tbody>
          <tr className="bg-[#e8e8e8]">
            <th className="border border-black px-2 py-1 font-bold w-1/2">
              Rang de l'étudiant au {semLabel}
            </th>
            <th className="border border-black px-2 py-1 font-bold w-1/2">Mention</th>
          </tr>
          <tr>
            <td className="border border-black px-1.5 py-0 text-center">
              {rank}
              <sup>ème</sup> / {totalStudents}
            </td>
            <td className="border border-black px-1.5 py-0 text-center font-semibold">{mention}</td>
          </tr>
        </tbody>
      </table>

      <table className="w-full text-[9px] leading-[11px] border-collapse mb-1">
        <thead>
          <tr className="bg-[#d6e4f0]">
            <th colSpan={ueData.length + 1} className="border border-black px-2 py-1.5 font-bold">
              État de la Validation des Crédits au {semLabel}
            </th>
          </tr>
          <tr className="bg-[#e8e8e8]">
            {ueData.map((u) => (
              <th key={u.name} className="border border-black px-2 py-1 font-bold">
                {u.name}
              </th>
            ))}
            <th className="border border-black px-2 py-1 font-bold">
              Crédits validés au {semLabel}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            {ueData.map((u) => (
              <td key={u.name} className="border border-black px-1.5 py-0 text-center font-semibold">
                {u.acquired} Crédits / {u.total}
              </td>
            ))}
            <td className="border border-black px-1.5 py-0 text-center font-bold">
              {totalCreditsAcquired} Crédits / {totalCreditsMax}
            </td>
          </tr>
          <tr>
            {ueData.map((u) => (
              <td key={u.name} className="border border-black px-1.5 py-0 text-center text-[8.5px] italic">
                {u.ueAcquise
                  ? "UE Acquise"
                  : u.ueCompensee
                  ? "UE Acquise par Compensation"
                  : "UE non Acquise"}
              </td>
            ))}
            <td className="border border-black px-1.5 py-0 text-center text-[8.5px] italic font-semibold">
              {grades.moyenne >= 10
                ? totalCreditsAcquired === totalCreditsMax
                  ? "Semestre Acquis"
                  : "Semestre Acquis par Compensation"
                : "Semestre non Acquis"}
            </td>
          </tr>
        </tbody>
      </table>

      <p className="text-[11px] mt-1 font-serif">
        <strong>Décision du Jury : </strong>
        <strong className="underline text-black">
          {grades.moyenne >= 10
            ? `${semLabel} validé`
            : `${semLabel} non validé`}
        </strong>
      </p>
    </>
  );
};

const AnnualBulletin = ({ student, rank, classData }: { student: Student; rank: number; classData: any }) => {
  const totalStudents = classData.total;
  const decision = getDecision(student.moyenneGenerale, student.s5.moyenne, student.s6.moyenne, student);
  const credS5 = getCreditsS5(student);
  const credS6 = getCreditsS6(student);
  const credits = credS5 + credS6;
  const mention = getMention(student.moyenneGenerale);

  const niveau = student.classeKey?.split('-')[1];
  const [labelS5, labelS6] = getSemesterLabels(niveau);

  return (
    <>
      <table className="w-full text-[10.5px] border-collapse mb-1.5">
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
            <td className="border border-black px-2 py-1.5 font-semibold">{labelS5}</td>
            <td className="border border-black px-1 py-1.5 text-center">1,00</td>
            <td className="border border-black px-1 py-1.5 text-center">
              <Note v={student.s5.moyenne || 0} />
            </td>
            <td className="border border-black px-1 py-1.5 text-center">{credS5} / 30</td>
            <td className="border border-black px-1 py-1.5 text-center">
              <Note v={classData.s5Moy || 0} />
            </td>
          </tr>
          <tr>
            <td className="border border-black px-2 py-1.5 font-semibold">{labelS6}</td>
            <td className="border border-black px-1 py-1.5 text-center">1,00</td>
            <td className="border border-black px-1 py-1.5 text-center">
              <Note v={student.s6.moyenne || 0} />
            </td>
            <td className="border border-black px-1 py-1.5 text-center">{credS6} / 30</td>
            <td className="border border-black px-1 py-1.5 text-center">
              <Note v={classData.s6Moy || 0} />
            </td>
          </tr>
          <tr className="bg-[#fff3cd]">
            <td className="border border-black px-2 py-1.5 font-bold uppercase">Moyenne Annuelle</td>
            <td className="border border-black px-1 py-1.5 text-center font-bold">2,00</td>
            <td className="border border-black px-1 py-1.5 text-center text-[13px]">
              <Note v={student.moyenneGenerale || 0} bold />
            </td>
            <td className="border border-black px-1 py-1.5 text-center font-bold">
              {credits} / 60
            </td>
            <td className="border border-black px-1 py-1.5 text-center">
              <Note v={classData.annuel || 0} bold />
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
              <sup>ème</sup> / {totalStudents}
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
            <th className="border border-black px-2 py-1 font-bold">Crédits {labelS5}</th>
            <th className="border border-black px-2 py-1 font-bold">Crédits {labelS6}</th>
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

      <p className="text-[12px] mt-3 font-serif">
        <strong>Décision du Conseil d'Établissement : </strong>
        <strong className="underline text-black">
          {decision.label}
        </strong>
      </p>
      <p className="text-[12px] mt-1 font-serif">
        <strong>Mention : </strong>
        <strong className="text-black">{mention}</strong>
      </p>
    </>
  );
};

export const BulletinPrintContent = ({ student, view, students }: Props) => {
  const today = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const localIdentity = student ? loadIdentity(student.matricule) : {};
  const identity = {
    dateNaissance: student?.dateNaissance || localIdentity.dateNaissance || "",
    lieuNaissance: student?.lieuNaissance || localIdentity.lieuNaissance || "",
    sexe: student?.sexe || localIdentity.sexe || "",
    etablissement: student?.etablissement || localIdentity.etablissement || "",
  };

  const classData = useMemo(() => {
    const list = students.length ? students : student ? [student] : [];
    const safe = (n: number) => (list.length ? n : 0);
    const s5Subjects = getSubjects(student?.classeKey as ClasseKey, "s5");
    const s6Subjects = getSubjects(student?.classeKey as ClasseKey, "s6");

    return {
      s5: Object.fromEntries(
        s5Subjects.map((s) => [
          s.key,
          safe(list.reduce((a, st) => a + ((st.s5 as any)[s.key] || 0), 0) / (list.length || 1)),
        ])
      ) as Record<string, number>,
      s6: Object.fromEntries(
        s6Subjects.map((s) => [
          s.key,
          safe(list.reduce((a, st) => a + ((st.s6 as any)[s.key] || 0), 0) / (list.length || 1)),
        ])
      ) as Record<string, number>,
      s5Moy: safe(list.reduce((a, s) => a + (s.s5.moyenne || 0), 0) / (list.length || 1)),
      s6Moy: safe(list.reduce((a, s) => a + (s.s6.moyenne || 0), 0) / (list.length || 1)),
      annuel: safe(list.reduce((a, s) => a + (s.moyenneGenerale || 0), 0) / (list.length || 1)),
      total: list.length,
      stats: {
        s5: computePromoStats(list.map((s) => s.s5.moyenne || 0)),
        s6: computePromoStats(list.map((s) => s.s6.moyenne || 0)),
        annuel: computePromoStats(list.map((s) => s.moyenneGenerale || 0)),
      },
    };
  }, [students, student]);

  const rank = useMemo(() => {
    if (!student || !students.length) return 0;
    const sorted = [...students].sort((a, b) => {
      if (view === "s5") return (b.s5.moyenne || 0) - (a.s5.moyenne || 0);
      if (view === "s6") return (b.s6.moyenne || 0) - (a.s6.moyenne || 0);
      return (b.moyenneGenerale || 0) - (a.moyenneGenerale || 0);
    });
    return sorted.findIndex((s) => s.matricule === student.matricule) + 1;
  }, [student, view, students]);

  const niveau = student?.classeKey?.split('-')[1];
  const [labelS5, labelS6] = getSemesterLabels(niveau);

  const titleLabel =
    view === "s5"
      ? `Bulletin de notes du ${labelS5}`
      : view === "s6"
      ? `Bulletin de notes du ${labelS6}`
      : "Bulletin de notes Annuel";

  return (
    <div
      className="print-area bg-white text-black px-6 py-0"
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
    >
      {/* En-tête tripartite officiel */}
      <div className="grid grid-cols-3 gap-3 items-start mb-2">
        <div className="text-[10px] leading-tight text-center">
          <p className="font-bold uppercase">Institut National de la Poste,</p>
          <p className="font-bold uppercase">des Technologies de l'Information</p>
          <p className="font-bold uppercase">et de la Communication</p>
          <div className="my-1 mx-auto w-24 border-t border-black" />
          <p className="font-semibold uppercase text-[9.5px]">Direction des Études</p>
          <p className="font-semibold uppercase text-[9.5px]">et de la Pédagogie</p>
          <div className="my-1 mx-auto w-16 border-t border-black" />
          <p className="text-[9px] italic">B.P. 2241 — Libreville</p>
        </div>
        <div className="flex flex-col items-center">
          <img src={logo} alt="INPTIC" className="h-[48px] w-[48px] object-contain" />
        </div>
        <div className="text-[10px] leading-tight text-center">
          <p className="font-bold uppercase">République Gabonaise</p>
          <div className="my-1 mx-auto w-24 border-t border-black" />
          <p className="italic font-semibold">Union — Travail — Justice</p>
        </div>
      </div>

      {/* Titre */}
      <div className="text-center my-1.5">
        <h1 className="text-[17px] font-bold uppercase tracking-wide">
          {titleLabel}
        </h1>
        <div className="mx-auto mt-0.5 w-56 border-t border-black" />
        <p className="text-[11px] mt-1">
          Année universitaire : <strong>2025 — 2026</strong>
        </p>
      </div>

      {/* Classe */}
      <p className="text-[11px] mb-1.5">
        <strong>Classe :</strong> {student.classeKey || "Non assignée"}
      </p>

      {/* Identité étudiant */}
      <table className="w-full text-[11px] mb-1.5 border-collapse leading-[13px]">
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
              Numéro étudiant (matricule)
            </td>
            <td className="border border-black px-2 py-1.5 font-mono">
              {student.matricule}
            </td>
          </tr>
        </tbody>
      </table>

      {view === "s5" && <SemesterBulletin student={student} sem="s5" rank={rank} classData={classData} />}
      {view === "s6" && <SemesterBulletin student={student} sem="s6" rank={rank} classData={classData} />}
      {view === "annuel" && <AnnualBulletin student={student} rank={rank} classData={classData} />}

      {/* Statistiques de la promotion */}
      <table className="w-full text-[9px] leading-[11px] border-collapse mt-1.5 mb-1">
        <thead>
          <tr className="bg-[#e8e8e8]">
            <th className="border border-black px-2 py-1 font-bold" colSpan={4}>
              Statistiques de la promotion ({classData.total} étudiants)
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
                  ? classData.stats.s5
                  : view === "s6"
                  ? classData.stats.s6
                  : classData.stats.annuel;
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

      {/* Pied de page officiel — signature + cachet */}
      <div className="mt-1.5 grid grid-cols-2 gap-6">
        <div className="text-[8.5px] italic leading-[10px]">
          <p className="font-semibold not-italic mb-1">Mentions légales :</p>
          Il ne sera délivré qu'un seul et unique exemplaire de bulletin de notes.
          L'étudiant est donc prié d'en faire plusieurs copies légalisées. Ce document
          est officiel et engage la responsabilité de la Direction des Études.
        </div>
        <div className="text-[11px] text-center">
          <p>Fait à Libreville, le {today}</p>
          <p className="mt-1 font-semibold uppercase">
            Le Directeur des Études et de la Pédagogie
          </p>
          {/* Zone cachet circulaire */}
          <div className="relative h-16 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 rounded-full border-2 border-[#1a5276] opacity-30 flex items-center justify-center">
                <span className="text-[7px] uppercase text-[#1a5276] font-bold leading-tight text-center">
                  INPTIC<br />Direction<br />Études
                </span>
              </div>
            </div>
          </div>
          <p className="font-bold border-t border-black pt-1 inline-block px-4">
            Davy Edgard MOUSSAVOU
          </p>
        </div>
      </div>
    </div>
  );
};
