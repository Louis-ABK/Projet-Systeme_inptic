import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Student } from "@/data/students";
import { Button } from "@/components/ui/button";
import { Printer, X, Download } from "lucide-react";
import { useRef } from "react";
import { exportBulletinToPDF } from "@/lib/pdf-export";
import { printElement } from "@/lib/print-bulletin";
import { useToast } from "@/hooks/use-toast";
import { BulletinPrintContent } from "./BulletinPrintContent";

interface Props {
  student: Student | null;
  view: "s5" | "s6" | "annuel";
  open: boolean;
  onOpenChange: (o: boolean) => void;
  students?: Student[];
}

export const BulletinModal = ({
  student,
  view,
  open,
  onOpenChange,
  students = [],
}: Props) => {
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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
        <div ref={printRef}>
          <BulletinPrintContent student={student} view={view} students={students} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
