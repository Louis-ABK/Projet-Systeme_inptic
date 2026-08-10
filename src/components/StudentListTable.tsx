import { Student } from "@/data/students";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, UserCog } from "lucide-react";
import { ClasseKey, FILIERES_MAP } from "@/data/referentiel";

type StudentListTableProps = {
  students: Student[];
  classeKey: string | null;
  onEdit: (s: Student) => void;
  onDelete: (s: Student) => void;
};

export const StudentListTable = ({ students, classeKey, onEdit, onDelete }: StudentListTableProps) => {
  if (students.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border rounded-lg bg-card/50">
        Aucun étudiant importé pour cette classe.
      </div>
    );
  }

  // Get department info for display
  const deptLabel = students[0]?.departement || "N/A";
  const filiereLabel = students[0]?.filiere ? FILIERES_MAP[students[0].filiere as keyof typeof FILIERES_MAP]?.label : "N/A";

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex gap-4 text-sm text-muted-foreground bg-accent/20 p-3 rounded-md border">
        <div><strong className="text-foreground">Département:</strong> {deptLabel}</div>
        <div><strong className="text-foreground">Filière:</strong> {filiereLabel}</div>
        <div><strong className="text-foreground">Classe:</strong> {classeKey || "Toutes"}</div>
        <div className="ml-auto"><strong className="text-foreground">Total:</strong> {students.length} étudiant(s)</div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Matricule</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Prénom</TableHead>
              <TableHead>Date de Naissance</TableHead>
              <TableHead>Lieu de Naissance</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.matricule}>
                <TableCell className="font-medium text-primary">{student.matricule}</TableCell>
                <TableCell className="uppercase">{student.nom}</TableCell>
                <TableCell className="capitalize">{student.prenom}</TableCell>
                <TableCell>{student.dateNaissance || "-"}</TableCell>
                <TableCell>{student.lieuNaissance || "-"}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(student)}
                    title="Modifier l'étudiant"
                  >
                    <UserCog className="h-4 w-4 text-blue-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(student)}
                    title="Supprimer l'étudiant"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
